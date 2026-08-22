import path from "node:path";
import { randomUUID } from "node:crypto";
import type { FileKind } from "@prisma/client";
import { prisma } from "@/server/db";
import { env } from "@/lib/env";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { Actor } from "@/server/auth/session";
import {
  assertPermission,
  canDownloadFile,
  canUploadFileKind,
  canViewProject,
} from "@/server/policies";
import { storage } from "@/server/providers/storage";
import { recordAudit } from "@/server/services/audit";
import { loadProjectContext, recordEvent } from "@/server/services/projects";
import { getSetting } from "@/server/services/settings";

const EXTENSION_ALLOWLIST = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
]);

export function sanitiseFilename(filename: string): string {
  const base = path.basename(filename).replace(/[^\w.\- ]+/g, "_").slice(0, 180);
  return base || "document";
}

export async function validateUpload(file: File): Promise<void> {
  const maxBytes = env().MAX_UPLOAD_BYTES;
  if (file.size === 0) throw new ValidationError("The file is empty");
  if (file.size > maxBytes) {
    throw new ValidationError(
      `Files must be ${Math.floor(maxBytes / (1024 * 1024))} MB or smaller`,
    );
  }
  const allowed = await getSetting("documents.allowedMimeTypes");
  const extension = path.extname(file.name).toLowerCase();
  if (!EXTENSION_ALLOWLIST.has(extension)) {
    throw new ValidationError(`Files of type ${extension || "unknown"} are not accepted`);
  }
  if (file.type && !allowed.includes(file.type)) {
    throw new ValidationError(`Files of type ${file.type} are not accepted`);
  }
}

function storageKey(scope: string, scopeId: string, filename: string): string {
  return `${scope}/${scopeId}/${randomUUID()}/${filename}`;
}

export async function storeQuoteRequestFile(quoteRequestId: string, file: File) {
  await validateUpload(file);
  const filename = sanitiseFilename(file.name);
  const key = storageKey("quote-requests", quoteRequestId, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage().put(key, buffer, file.type || "application/octet-stream");

  return prisma.quoteRequestFile.create({
    data: {
      quoteRequestId,
      filename,
      storageKey: key,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: buffer.byteLength,
      // No scanner is wired in the MVP; the status field records that fact
      // rather than silently claiming the file is clean.
      scanStatus: "PENDING",
    },
  });
}

export async function uploadProjectFile(
  actor: Actor,
  projectId: string,
  file: File,
  options: { kind: FileKind; note?: string; customerVisible?: boolean },
) {
  const context = await loadProjectContext(projectId);
  assertPermission(
    canUploadFileKind(actor, context, options.kind),
    "You cannot upload this kind of file to this project",
  );
  await validateUpload(file);

  const filename = sanitiseFilename(file.name);
  const key = storageKey("projects", projectId, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage().put(key, buffer, file.type || "application/octet-stream");

  const previous = await prisma.projectFile.findFirst({
    where: { projectId, kind: options.kind },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const record = await prisma.projectFile.create({
    data: {
      projectId,
      kind: options.kind,
      version: (previous?.version ?? 0) + 1,
      filename,
      storageKey: key,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: buffer.byteLength,
      scanStatus: "PENDING",
      customerVisible:
        options.customerVisible ??
        (options.kind === "ORIGINAL" || options.kind === "REFERENCE"),
      uploadedById: actor.id,
      note: options.note,
    },
  });

  await recordEvent(
    projectId,
    actor.id,
    "file.uploaded",
    `${actor.name} uploaded ${filename} (${options.kind.toLowerCase()} v${record.version})`,
  );
  await recordAudit({
    actorId: actor.id,
    action: "file.upload",
    resourceType: "ProjectFile",
    resourceId: record.id,
    metadata: { projectId, kind: options.kind },
  });

  return record;
}

/// Single entry point for reaching a stored document. Returns a short-lived
/// signed URL and always writes an audit record.
export async function authorizeFileAccess(
  actor: Actor,
  fileId: string,
): Promise<{ url: string; filename: string }> {
  const file = await prisma.projectFile.findUnique({ where: { id: fileId } });
  if (!file) throw new NotFoundError("File not found");

  const context = await loadProjectContext(file.projectId);
  assertPermission(canViewProject(actor, context), "You cannot access this project");
  assertPermission(canDownloadFile(actor, context, file), "You cannot access this file");

  if (file.scanStatus === "INFECTED") {
    throw new ValidationError("This file failed a malware scan and cannot be downloaded");
  }

  const url = await storage().signedDownloadUrl(file.storageKey, file.filename);
  await recordAudit({
    actorId: actor.id,
    action: "file.download",
    resourceType: "ProjectFile",
    resourceId: file.id,
    metadata: { projectId: file.projectId, kind: file.kind },
  });
  return { url, filename: file.filename };
}

export async function setFileVisibility(
  actor: Actor,
  fileId: string,
  customerVisible: boolean,
) {
  const file = await prisma.projectFile.findUnique({ where: { id: fileId } });
  if (!file) throw new NotFoundError("File not found");
  const context = await loadProjectContext(file.projectId);
  assertPermission(
    canUploadFileKind(actor, context, file.kind),
    "You cannot change this file",
  );

  const updated = await prisma.projectFile.update({
    where: { id: fileId },
    data: { customerVisible },
  });
  await recordAudit({
    actorId: actor.id,
    action: "file.visibility",
    resourceType: "ProjectFile",
    resourceId: fileId,
    metadata: { customerVisible },
  });
  return updated;
}
