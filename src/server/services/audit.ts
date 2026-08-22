import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";

export type AuditInput = {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
};

type Client = PrismaClient | Prisma.TransactionClient;

/// Writes to the audit trail. Pass the transaction client when auditing a
/// mutation so the log and the change commit together.
export async function recordAudit(input: AuditInput, client: Client = prisma): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: input.metadata,
    },
  });
}
