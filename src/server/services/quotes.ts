import { ProjectStatus, QuoteStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import type { Actor } from "@/server/auth/session";
import { NotFoundError, WorkflowError } from "@/lib/errors";
import { assertPermission, canApproveQuote, hasRole } from "@/server/policies";
import { reference } from "@/lib/reference";
import { recordAudit } from "@/server/services/audit";
import {
  loadProjectContext,
  recordEvent,
  transitionProject,
} from "@/server/services/projects";
import { estimateForService } from "@/server/services/pricing";
import { getSetting } from "@/server/services/settings";
import { issueInvoiceForQuote } from "@/server/services/billing";

export type QuoteLineInput = {
  description: string;
  quantity: number;
  unitPriceMinor: number;
};

/// Builds a draft quote from the pricing engine so staff start from the
/// configured rates rather than typing numbers from scratch.
export async function draftQuoteFromPricing(actor: Actor, projectId: string) {
  assertPermission(
    hasRole(actor, "PROJECT_MANAGER", "FINANCE", "SUPER_ADMIN"),
    "Only staff can prepare quotes",
  );
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { files: { where: { kind: "ORIGINAL" } } },
  });
  if (!project) throw new NotFoundError("Project not found");

  const breakdown = await estimateForService(project.serviceId, {
    wordCount: project.wordCount,
    complexity: project.complexity,
    deadline: project.deadline,
    fileCount: Math.max(1, project.files.length),
    needsFormatting: project.needsFormatting,
    needsResearch: project.needsResearch,
  });

  return createQuote(actor, projectId, {
    currency: breakdown.currency,
    items: breakdown.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPriceMinor: line.unitPriceMinor,
    })),
    discountMinor: 0,
    taxMinor: breakdown.taxMinor,
  });
}

export async function createQuote(
  actor: Actor,
  projectId: string,
  input: {
    currency: string;
    items: QuoteLineInput[];
    discountMinor?: number;
    taxMinor?: number;
    notes?: string;
    validDays?: number;
  },
) {
  assertPermission(
    hasRole(actor, "PROJECT_MANAGER", "FINANCE", "SUPER_ADMIN"),
    "Only staff can prepare quotes",
  );
  if (!input.items.length) throw new WorkflowError("A quote needs at least one line");

  const items = input.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPriceMinor: item.unitPriceMinor,
    totalMinor: item.quantity * item.unitPriceMinor,
  }));
  const subtotalMinor = items.reduce((sum, item) => sum + item.totalMinor, 0);
  const discountMinor = input.discountMinor ?? 0;
  const taxMinor = input.taxMinor ?? 0;
  const totalMinor = subtotalMinor - discountMinor + taxMinor;

  const validDays = input.validDays ?? 14;
  const quote = await prisma.quote.create({
    data: {
      reference: reference("QTE"),
      projectId,
      currency: input.currency,
      subtotalMinor,
      discountMinor,
      taxMinor,
      totalMinor,
      notes: input.notes,
      validUntil: new Date(Date.now() + validDays * 86_400_000),
      items: { create: items },
    },
    include: { items: true },
  });

  await recordEvent(projectId, actor.id, "quote.created", `Quote ${quote.reference} drafted`);
  await recordAudit({
    actorId: actor.id,
    action: "quote.create",
    resourceType: "Quote",
    resourceId: quote.id,
    metadata: { projectId, totalMinor },
  });
  return quote;
}

export async function sendQuote(actor: Actor, quoteId: string) {
  assertPermission(
    hasRole(actor, "PROJECT_MANAGER", "FINANCE", "SUPER_ADMIN"),
    "Only staff can send quotes",
  );
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new NotFoundError("Quote not found");
  if (quote.status !== QuoteStatus.DRAFT) {
    throw new WorkflowError("Only a draft quote can be sent");
  }

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: QuoteStatus.SENT, sentAt: new Date() },
  });

  await transitionProject(actor, quote.projectId, ProjectStatus.QUOTE_SENT);
  await transitionProject(actor, quote.projectId, ProjectStatus.AWAITING_CUSTOMER_APPROVAL);
  await recordEvent(
    quote.projectId,
    actor.id,
    "quote.sent",
    `Quote ${quote.reference} sent to the customer`,
  );
  await recordAudit({
    actorId: actor.id,
    action: "quote.send",
    resourceType: "Quote",
    resourceId: quoteId,
  });
  return updated;
}

export async function respondToQuote(
  actor: Actor,
  quoteId: string,
  decision: "ACCEPT" | "DECLINE",
) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new NotFoundError("Quote not found");

  const context = await loadProjectContext(quote.projectId);
  assertPermission(canApproveQuote(actor, context), "You cannot respond to this quote");

  if (quote.status !== QuoteStatus.SENT) {
    throw new WorkflowError("This quote is no longer awaiting a response");
  }
  if (quote.validUntil.getTime() < Date.now()) {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.EXPIRED },
    });
    throw new WorkflowError("This quote has expired. Please request a new one.");
  }

  if (decision === "DECLINE") {
    const declined = await prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.DECLINED, respondedAt: new Date() },
    });
    await recordEvent(
      quote.projectId,
      actor.id,
      "quote.declined",
      `Quote ${quote.reference} declined by the customer`,
    );
    await recordAudit({
      actorId: actor.id,
      action: "quote.decline",
      resourceType: "Quote",
      resourceId: quoteId,
    });
    return declined;
  }

  const accepted = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: QuoteStatus.ACCEPTED, respondedAt: new Date() },
  });

  await recordEvent(
    quote.projectId,
    actor.id,
    "quote.accepted",
    `Quote ${quote.reference} accepted by the customer`,
  );
  await recordAudit({
    actorId: actor.id,
    action: "quote.accept",
    resourceType: "Quote",
    resourceId: quoteId,
  });

  const dueDays = await getSetting("billing.invoiceDueDays");
  await issueInvoiceForQuote(quoteId, dueDays);
  await transitionProject(actor, quote.projectId, ProjectStatus.AWAITING_PAYMENT, {
    system: true,
  });

  return accepted;
}
