import { InvoiceStatus, PaymentStatus, ProjectStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import type { Actor } from "@/server/auth/session";
import { NotFoundError, WorkflowError } from "@/lib/errors";
import { assertPermission, canManagePricing, hasRole } from "@/server/policies";
import { recordAudit } from "@/server/services/audit";
import { recordEvent, transitionProject } from "@/server/services/projects";
import { paymentProvider } from "@/server/providers/payments";
import { notify } from "@/server/services/notifications";

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00Z`) } },
  });
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

export async function issueInvoiceForQuote(quoteId: string, dueDays: number) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      items: true,
      invoice: true,
      project: {
        include: {
          owner: { select: { name: true, email: true } },
          organization: { select: { id: true, name: true, billingEmail: true } },
        },
      },
    },
  });
  if (!quote) throw new NotFoundError("Quote not found");
  if (quote.invoice) return quote.invoice;

  const invoice = await prisma.invoice.create({
    data: {
      number: await nextInvoiceNumber(),
      status: InvoiceStatus.ISSUED,
      projectId: quote.projectId,
      quoteId: quote.id,
      organizationId: quote.project.organizationId,
      billToName: quote.project.organization?.name ?? quote.project.owner.name,
      billToEmail:
        quote.project.organization?.billingEmail ?? quote.project.owner.email,
      currency: quote.currency,
      subtotalMinor: quote.subtotalMinor - quote.discountMinor,
      taxMinor: quote.taxMinor,
      totalMinor: quote.totalMinor,
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + dueDays * 86_400_000),
      lines: {
        create: quote.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceMinor: item.unitPriceMinor,
          totalMinor: item.totalMinor,
        })),
      },
    },
    include: { lines: true },
  });

  await recordEvent(
    quote.projectId,
    null,
    "invoice.issued",
    `Invoice ${invoice.number} issued`,
  );
  await recordAudit({
    action: "invoice.issue",
    resourceType: "Invoice",
    resourceId: invoice.id,
    metadata: { quoteId, projectId: quote.projectId },
  });
  return invoice;
}

export async function startPayment(
  actor: Actor,
  invoiceId: string,
  providerKey: string,
  method = "default",
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { project: { select: { ownerUserId: true, organizationId: true } } },
  });
  if (!invoice) throw new NotFoundError("Invoice not found");

  const isOwner = invoice.project?.ownerUserId === actor.id;
  const isOrgMember = invoice.organizationId
    ? actor.memberships.some((m) => m.organizationId === invoice.organizationId)
    : false;
  assertPermission(
    isOwner || isOrgMember || hasRole(actor, "FINANCE", "SUPER_ADMIN"),
    "You cannot pay this invoice",
  );
  if (invoice.status === InvoiceStatus.PAID) {
    throw new WorkflowError("This invoice is already paid");
  }

  const provider = paymentProvider(providerKey);
  const intent = await provider.createIntent({
    invoiceId: invoice.id,
    amountMinor: invoice.totalMinor - invoice.amountPaidMinor,
    currency: invoice.currency,
    customerEmail: invoice.billToEmail,
    customerName: invoice.billToName,
    reference: invoice.number,
    method,
  });

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      provider: intent.provider,
      providerRef: intent.providerRef,
      method,
      status: intent.status,
      currency: invoice.currency,
      amountMinor: invoice.totalMinor - invoice.amountPaidMinor,
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "payment.initiate",
    resourceType: "Payment",
    resourceId: payment.id,
    metadata: { provider: intent.provider, invoiceId },
  });

  return { payment, instructions: intent.instructions, redirectUrl: intent.redirectUrl };
}

/// Applies a terminal payment state. Used by both the manual confirmation path
/// and provider webhooks so the ledger logic exists in exactly one place.
export async function settlePayment(
  paymentId: string,
  status: PaymentStatus,
  options: { actorId?: string; failureReason?: string } = {},
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: true },
  });
  if (!payment) throw new NotFoundError("Payment not found");

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status, failureReason: options.failureReason },
    });

    if (status === PaymentStatus.SUCCESSFUL) {
      const amountPaidMinor = payment.invoice.amountPaidMinor + payment.amountMinor;
      const fullyPaid = amountPaidMinor >= payment.invoice.totalMinor;
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          amountPaidMinor,
          status: fullyPaid ? InvoiceStatus.PAID : payment.invoice.status,
          paidAt: fullyPaid ? new Date() : payment.invoice.paidAt,
        },
      });
    }

    if (status === PaymentStatus.REFUNDED) {
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: InvoiceStatus.REFUNDED, amountPaidMinor: 0 },
      });
    }

    await recordAudit(
      {
        actorId: options.actorId,
        action: `payment.${status.toLowerCase()}`,
        resourceType: "Payment",
        resourceId: paymentId,
        metadata: { invoiceId: payment.invoiceId },
      },
      tx,
    );
  });

  if (status !== PaymentStatus.SUCCESSFUL) return;

  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: payment.invoiceId },
    include: { project: { select: { id: true, ownerUserId: true, status: true } } },
  });
  if (invoice.status !== InvoiceStatus.PAID || !invoice.project) return;

  await recordEvent(
    invoice.project.id,
    options.actorId ?? null,
    "payment.received",
    `Payment received for invoice ${invoice.number}`,
  );
  if (invoice.project.status === ProjectStatus.AWAITING_PAYMENT) {
    await transitionProject(null, invoice.project.id, ProjectStatus.PAID, { system: true });
    await transitionProject(null, invoice.project.id, ProjectStatus.AWAITING_ASSIGNMENT, {
      system: true,
    });
  }
  await notify(invoice.project.ownerUserId, {
    type: "payment.received",
    title: `Payment received for ${invoice.number}`,
    body: "Thank you. Your project has moved into our production queue.",
    link: `/dashboard/projects/${invoice.project.id}`,
  });
}

export async function confirmPaymentManually(actor: Actor, paymentId: string) {
  assertPermission(
    canManagePricing(actor),
    "Only finance staff can confirm payments",
  );
  return settlePayment(paymentId, PaymentStatus.SUCCESSFUL, { actorId: actor.id });
}

export async function refundPayment(actor: Actor, paymentId: string) {
  assertPermission(canManagePricing(actor), "Only finance staff can issue refunds");
  return settlePayment(paymentId, PaymentStatus.REFUNDED, { actorId: actor.id });
}
