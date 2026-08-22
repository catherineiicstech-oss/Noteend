import type { Complexity, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import type { Actor } from "@/server/auth/session";
import { NotFoundError } from "@/lib/errors";
import { assertPermission, hasRole } from "@/server/policies";
import { reference } from "@/lib/reference";
import { recordAudit } from "@/server/services/audit";
import { estimateForService } from "@/server/services/pricing";
import { queueEmail } from "@/server/services/notifications";
import { createProject } from "@/server/services/projects";
import { siteConfig } from "@/lib/site";
import { storeQuoteRequestFile } from "@/server/services/files";

export type QuoteRequestInput = {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  organizationName?: string;
  country?: string;
  preferredContact: string;
  serviceId?: string;
  serviceOther?: string;
  documentType?: string;
  wordCount: number;
  complexity: Complexity;
  deadline: Date;
  citationStyle?: string;
  industry?: string;
  confidentiality?: string;
  needsFormatting: boolean;
  needsResearch: boolean;
  description: string;
  userId?: string | null;
  organizationId?: string | null;
};

/// Public entry point for the "Get a Quote" wizard. Accepts guests: the
/// estimate is indicative only and a human confirms the binding quote.
export async function submitQuoteRequest(input: QuoteRequestInput, files: File[] = []) {
  let estimateMinor: number | null = null;
  let estimateCurrency: string | null = null;

  if (input.serviceId) {
    try {
      const breakdown = await estimateForService(input.serviceId, {
        wordCount: input.wordCount,
        complexity: input.complexity,
        deadline: input.deadline,
        fileCount: Math.max(1, files.length),
        needsFormatting: input.needsFormatting,
        needsResearch: input.needsResearch,
      });
      estimateMinor = breakdown.totalMinor;
      estimateCurrency = breakdown.currency;
    } catch {
      // A service without an active pricing rule simply produces no estimate.
      estimateMinor = null;
    }
  }

  const request = await prisma.quoteRequest.create({
    data: {
      reference: reference("QR"),
      contactName: input.contactName,
      contactEmail: input.contactEmail.trim().toLowerCase(),
      contactPhone: input.contactPhone,
      organizationName: input.organizationName,
      country: input.country,
      preferredContact: input.preferredContact,
      serviceId: input.serviceId,
      serviceOther: input.serviceOther,
      documentType: input.documentType,
      wordCount: input.wordCount,
      complexity: input.complexity,
      deadline: input.deadline,
      citationStyle: input.citationStyle,
      industry: input.industry,
      confidentiality: input.confidentiality,
      needsFormatting: input.needsFormatting,
      needsResearch: input.needsResearch,
      description: input.description,
      estimateMinor,
      estimateCurrency,
      userId: input.userId ?? null,
      organizationId: input.organizationId ?? null,
    },
  });

  for (const file of files) {
    await storeQuoteRequestFile(request.id, file);
  }

  await queueEmail(
    request.contactEmail,
    `We have received your request (${request.reference})`,
    `Hello ${request.contactName},\n\nYour request has been received. Our team will review your requirements and provide a quotation.\n\nReference: ${request.reference}\n\n${siteConfig.name}`,
  );

  await recordAudit({
    actorId: input.userId ?? undefined,
    action: "quote_request.submit",
    resourceType: "QuoteRequest",
    resourceId: request.id,
  });

  return request;
}

export async function listQuoteRequests(actor: Actor, status?: string) {
  assertPermission(
    hasRole(actor, "PROJECT_MANAGER", "FINANCE", "SUPER_ADMIN"),
    "Only staff can view incoming requests",
  );
  const where: Prisma.QuoteRequestWhereInput = {};
  if (status) where.status = status as Prisma.EnumQuoteRequestStatusFilter["equals"];
  return prisma.quoteRequest.findMany({
    where,
    include: { service: { select: { name: true } }, files: true, project: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/// Turns an accepted lead into a project, creating a shadow customer account
/// when the request came from a guest.
export async function convertToProject(actor: Actor, quoteRequestId: string) {
  assertPermission(
    hasRole(actor, "PROJECT_MANAGER", "SUPER_ADMIN"),
    "Only project managers can convert requests",
  );

  const request = await prisma.quoteRequest.findUnique({
    where: { id: quoteRequestId },
    include: { files: true, project: true },
  });
  if (!request) throw new NotFoundError("Quote request not found");
  if (request.project) return request.project;
  if (!request.serviceId) {
    throw new NotFoundError("Choose a service for this request before converting it");
  }

  let userId = request.userId;
  if (!userId) {
    const user = await prisma.user.upsert({
      where: { email: request.contactEmail },
      create: {
        email: request.contactEmail,
        name: request.contactName,
        phone: request.contactPhone,
        country: request.country,
        roles: { create: { role: "CUSTOMER" } },
      },
      update: {},
    });
    userId = user.id;
  }

  const project = await createProject(actor, {
    title: request.documentType
      ? `${request.documentType} — ${request.contactName}`
      : `Request ${request.reference}`,
    serviceId: request.serviceId,
    ownerUserId: userId,
    organizationId: request.organizationId,
    documentType: request.documentType,
    wordCount: request.wordCount,
    complexity: request.complexity,
    deadline: request.deadline,
    citationStyle: request.citationStyle,
    industry: request.industry,
    confidentiality: request.confidentiality,
    instructions: request.description,
    needsFormatting: request.needsFormatting,
    needsResearch: request.needsResearch,
    quoteRequestId: request.id,
  });

  // Carry the uploaded documents across as the project's originals.
  for (const file of request.files) {
    await prisma.projectFile.create({
      data: {
        projectId: project.id,
        kind: "ORIGINAL",
        version: 1,
        filename: file.filename,
        storageKey: file.storageKey,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        scanStatus: file.scanStatus,
        customerVisible: true,
        uploadedById: userId,
      },
    });
  }

  await prisma.quoteRequest.update({
    where: { id: quoteRequestId },
    data: { status: "CONVERTED", userId },
  });

  return project;
}
