import type { MessageVisibility } from "@prisma/client";
import { prisma } from "@/server/db";
import type { Actor } from "@/server/auth/session";
import {
  assertPermission,
  canPostInternalNote,
  canViewProject,
  isStaff,
  visibleMessageScopes,
} from "@/server/policies";
import { loadProjectContext } from "@/server/services/projects";
import { notify } from "@/server/services/notifications";
import { recordAudit } from "@/server/services/audit";

export async function listMessages(actor: Actor, projectId: string) {
  const context = await loadProjectContext(projectId);
  assertPermission(canViewProject(actor, context), "You cannot access this project");

  return prisma.projectMessage.findMany({
    where: { projectId, visibility: { in: visibleMessageScopes(actor, context) } },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function postMessage(
  actor: Actor,
  projectId: string,
  body: string,
  visibility: MessageVisibility = "CUSTOMER",
) {
  const context = await loadProjectContext(projectId);
  assertPermission(canViewProject(actor, context), "You cannot access this project");
  if (visibility === "INTERNAL") {
    assertPermission(
      canPostInternalNote(actor, context),
      "Only staff can add internal notes",
    );
  }

  const message = await prisma.projectMessage.create({
    data: { projectId, authorId: actor.id, body, visibility, readBy: [actor.id] },
    include: { author: { select: { id: true, name: true } } },
  });

  await recordAudit({
    actorId: actor.id,
    action: "message.post",
    resourceType: "ProjectMessage",
    resourceId: message.id,
    metadata: { projectId, visibility },
  });

  await notifyParticipants(actor, projectId, visibility, body);
  return message;
}

async function notifyParticipants(
  actor: Actor,
  projectId: string,
  visibility: MessageVisibility,
  body: string,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      reference: true,
      ownerUserId: true,
      assignments: { where: { unassignedAt: null }, select: { userId: true } },
    },
  });
  if (!project) return;

  const recipients = new Set<string>();
  for (const assignment of project.assignments) recipients.add(assignment.userId);
  if (visibility === "CUSTOMER") recipients.add(project.ownerUserId);
  recipients.delete(actor.id);

  const preview = body.length > 140 ? `${body.slice(0, 137)}...` : body;
  for (const userId of recipients) {
    await notify(userId, {
      type: "message.new",
      title: `New message on ${project.reference}`,
      body: preview,
      link: isStaff(actor) ? `/dashboard/projects/${projectId}` : `/staff/projects/${projectId}`,
    });
  }
}

export async function markThreadRead(actor: Actor, projectId: string) {
  const context = await loadProjectContext(projectId);
  assertPermission(canViewProject(actor, context), "You cannot access this project");

  const messages = await prisma.projectMessage.findMany({
    where: {
      projectId,
      visibility: { in: visibleMessageScopes(actor, context) },
      NOT: { readBy: { has: actor.id } },
    },
    select: { id: true, readBy: true },
  });

  await Promise.all(
    messages.map((message) =>
      prisma.projectMessage.update({
        where: { id: message.id },
        data: { readBy: { set: [...message.readBy, actor.id] } },
      }),
    ),
  );
  return messages.length;
}
