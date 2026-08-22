import { Prisma, ProjectStatus, type Complexity } from "@prisma/client";
import { prisma } from "@/server/db";
import type { Actor } from "@/server/auth/session";
import { NotFoundError, WorkflowError } from "@/lib/errors";
import {
  assertPermission,
  canAssignStaff,
  canManageProject,
  canViewProject,
  hasRole,
  isSuperAdmin,
  orgRole,
  type ProjectContext,
} from "@/server/policies";
import { recordAudit } from "@/server/services/audit";
import { canTransition, STATUS_LABELS } from "@/server/services/workflow";
import { reference } from "@/lib/reference";
import { notify } from "@/server/services/notifications";
import { getSetting } from "@/server/services/settings";

const contextSelect = {
  id: true,
  ownerUserId: true,
  organizationId: true,
  status: true,
  isPremium: true,
  assignments: { select: { userId: true, role: true, unassignedAt: true } },
} satisfies Prisma.ProjectSelect;

export async function loadProjectContext(projectId: string): Promise<ProjectContext> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: contextSelect,
  });
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

/// Every project read goes through here so that scoping is applied once.
export async function getProjectForActor(actor: Actor, projectId: string) {
  const context = await loadProjectContext(projectId);
  assertPermission(canViewProject(actor, context), "You cannot access this project");
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      service: { include: { category: true } },
      owner: { select: { id: true, name: true, email: true } },
      organization: true,
      assignments: {
        where: { unassignedAt: null },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      quotes: { include: { items: true }, orderBy: { createdAt: "desc" } },
      invoices: { include: { lines: true, payments: true }, orderBy: { createdAt: "desc" } },
      files: { orderBy: [{ kind: "asc" }, { version: "desc" }] },
      events: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      qaReviews: {
        include: { items: true, reviewer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      review: true,
    },
  });
}

export type ProjectListFilter = {
  status?: ProjectStatus[];
  organizationId?: string;
  assignedToMe?: boolean;
  search?: string;
};

/// Builds the tenancy filter for a list query. Customers see their own
/// projects, org members see their organization, editors see assignments.
export function scopeFilter(actor: Actor, filter: ProjectListFilter): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {};
  if (filter.status?.length) where.status = { in: filter.status };
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { reference: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  if (isSuperAdmin(actor) || hasRole(actor, "PROJECT_MANAGER", "FINANCE")) {
    if (filter.organizationId) where.organizationId = filter.organizationId;
    if (filter.assignedToMe) {
      where.assignments = { some: { userId: actor.id, unassignedAt: null } };
    }
    return where;
  }

  if (hasRole(actor, "EDITOR", "QA_REVIEWER")) {
    where.assignments = { some: { userId: actor.id, unassignedAt: null } };
    return where;
  }

  const organizationIds = actor.memberships.map((entry) => entry.organizationId);
  if (filter.organizationId) {
    assertPermission(
      organizationIds.includes(filter.organizationId),
      "You are not a member of this organization",
    );
    const role = orgRole(actor, filter.organizationId);
    where.organizationId = filter.organizationId;
    // Ordinary members only see the projects they submitted.
    if (role === "MEMBER") where.ownerUserId = actor.id;
    return where;
  }

  where.OR = [
    ...(where.OR ?? []),
    { ownerUserId: actor.id },
    ...(organizationIds.length
      ? [{ organizationId: { in: organizationIds }, ownerUserId: actor.id }]
      : []),
  ];
  return where;
}

export async function listProjects(actor: Actor, filter: ProjectListFilter = {}) {
  return prisma.project.findMany({
    where: scopeFilter(actor, filter),
    include: {
      service: { select: { name: true, slug: true } },
      organization: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      assignments: {
        where: { unassignedAt: null },
        include: { user: { select: { id: true, name: true } } },
      },
    },
    orderBy: [{ deadline: "asc" }],
    take: 200,
  });
}

export type CreateProjectInput = {
  title: string;
  serviceId: string;
  ownerUserId: string;
  organizationId?: string | null;
  documentType?: string | null;
  wordCount: number;
  complexity: Complexity;
  deadline: Date;
  citationStyle?: string | null;
  industry?: string | null;
  confidentiality?: string | null;
  instructions?: string | null;
  needsFormatting?: boolean;
  needsResearch?: boolean;
  quoteRequestId?: string | null;
};

export async function createProject(actor: Actor | null, input: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      reference: reference("PRJ"),
      title: input.title,
      serviceId: input.serviceId,
      ownerUserId: input.ownerUserId,
      organizationId: input.organizationId ?? null,
      documentType: input.documentType ?? null,
      wordCount: input.wordCount,
      complexity: input.complexity,
      deadline: input.deadline,
      citationStyle: input.citationStyle ?? null,
      industry: input.industry ?? null,
      confidentiality: input.confidentiality ?? null,
      instructions: input.instructions ?? null,
      needsFormatting: input.needsFormatting ?? false,
      needsResearch: input.needsResearch ?? false,
      quoteRequestId: input.quoteRequestId ?? null,
      status: ProjectStatus.QUOTE_REQUESTED,
    },
  });

  await recordEvent(project.id, actor?.id ?? null, "project.created", "Project created");
  await recordAudit({
    actorId: actor?.id,
    action: "project.create",
    resourceType: "Project",
    resourceId: project.id,
  });
  return project;
}

export async function recordEvent(
  projectId: string,
  actorId: string | null,
  type: string,
  summary: string,
  metadata?: Prisma.InputJsonValue,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await client.projectEvent.create({
    data: { projectId, actorId, type, summary, metadata },
  });
}

export type TransitionOptions = {
  reason?: string;
  /// Skips permission checks for internal, system-driven transitions such as
  /// a confirmed payment moving a project to PAID.
  system?: boolean;
};

/// The only supported way to change project status.
export async function transitionProject(
  actor: Actor | null,
  projectId: string,
  next: ProjectStatus,
  options: TransitionOptions = {},
) {
  const context = await loadProjectContext(projectId);

  if (!options.system) {
    if (!actor) throw new WorkflowError("Authentication required");
    assertPermission(canManageProject(actor, context), "You cannot change this project");
  }

  if (context.status === next) return context;

  if (!canTransition(context.status, next)) {
    throw new WorkflowError(
      `Cannot move a project from ${STATUS_LABELS[context.status]} to ${STATUS_LABELS[next]}`,
    );
  }

  await enforceStatusPreconditions(projectId, context, next);

  const updated = await prisma.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: { id: projectId },
      data: {
        status: next,
        completedAt: next === ProjectStatus.COMPLETED ? new Date() : undefined,
        deliveredAt: next === ProjectStatus.DELIVERED ? new Date() : undefined,
      },
    });
    await recordEvent(
      projectId,
      actor?.id ?? null,
      "project.status_changed",
      `Status changed to ${STATUS_LABELS[next]}${options.reason ? ` — ${options.reason}` : ""}`,
      { from: context.status, to: next },
      tx,
    );
    await recordAudit(
      {
        actorId: actor?.id,
        action: "project.transition",
        resourceType: "Project",
        resourceId: projectId,
        metadata: { from: context.status, to: next },
      },
      tx,
    );
    return project;
  });

  await notifyStatusChange(updated.id, next);
  return updated;
}

/// Business rules that gate specific statuses.
async function enforceStatusPreconditions(
  projectId: string,
  context: ProjectContext,
  next: ProjectStatus,
) {
  if (next === ProjectStatus.ASSIGNED) {
    const paid = await isPaidOrCreditApproved(projectId);
    if (!paid) {
      throw new WorkflowError(
        "Production cannot start until payment is confirmed or credit terms are approved",
      );
    }
    const hasEditor = context.assignments.some(
      (assignment) => assignment.role === "EDITOR" && assignment.unassignedAt === null,
    );
    if (!hasEditor) throw new WorkflowError("Assign an editor before moving to Assigned");
  }

  if (next === ProjectStatus.COMPLETED && context.isPremium) {
    const requireQa = await getSetting("workflow.requireQaForPremium");
    if (requireQa) {
      const passed = await prisma.qAReview.findFirst({
        where: { projectId, outcome: "PASS" },
      });
      if (!passed) {
        throw new WorkflowError("A passing QA review is required before completion");
      }
    }
  }

  if (next === ProjectStatus.DELIVERED) {
    const finalFile = await prisma.projectFile.findFirst({
      where: { projectId, kind: "FINAL", customerVisible: true },
    });
    if (!finalFile) {
      throw new WorkflowError("Publish a customer-visible final document before delivering");
    }
  }
}

export async function isPaidOrCreditApproved(projectId: string): Promise<boolean> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: {
      organization: { select: { creditTermsApproved: true } },
      invoices: { select: { status: true } },
    },
  });
  if (project.organization?.creditTermsApproved) return true;
  return project.invoices.some((invoice) => invoice.status === "PAID");
}

export async function assignStaff(
  actor: Actor,
  projectId: string,
  userId: string,
  role: "PROJECT_MANAGER" | "EDITOR" | "QA_REVIEWER",
) {
  assertPermission(canAssignStaff(actor), "Only project managers can assign staff");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });
  if (!user) throw new NotFoundError("User not found");

  const requiredRole =
    role === "EDITOR" ? "EDITOR" : role === "QA_REVIEWER" ? "QA_REVIEWER" : "PROJECT_MANAGER";
  const eligible = user.roles.some(
    (entry) => entry.role === requiredRole || entry.role === "SUPER_ADMIN",
  );
  if (!eligible) {
    throw new WorkflowError(`${user.name} does not hold the ${requiredRole} role`);
  }

  const assignment = await prisma.projectAssignment.upsert({
    where: { projectId_userId_role: { projectId, userId, role } },
    create: { projectId, userId, role },
    update: { unassignedAt: null, assignedAt: new Date() },
  });

  await recordEvent(
    projectId,
    actor.id,
    "project.assigned",
    `${user.name} assigned as ${role.toLowerCase().replace("_", " ")}`,
  );
  await recordAudit({
    actorId: actor.id,
    action: "project.assign",
    resourceType: "Project",
    resourceId: projectId,
    metadata: { userId, role },
  });
  await notify(userId, {
    type: "project.assigned",
    title: "You have been assigned to a project",
    body: `You are now the ${role.toLowerCase().replace("_", " ")} on a project.`,
    link: `/staff/projects/${projectId}`,
  });

  return assignment;
}

export async function unassignStaff(
  actor: Actor,
  projectId: string,
  assignmentId: string,
) {
  assertPermission(canAssignStaff(actor), "Only project managers can change assignments");
  const assignment = await prisma.projectAssignment.update({
    where: { id: assignmentId },
    data: { unassignedAt: new Date() },
    include: { user: { select: { name: true } } },
  });
  await recordEvent(
    projectId,
    actor.id,
    "project.unassigned",
    `${assignment.user.name} removed from the project`,
  );
  await recordAudit({
    actorId: actor.id,
    action: "project.unassign",
    resourceType: "Project",
    resourceId: projectId,
    metadata: { assignmentId },
  });
  return assignment;
}

async function notifyStatusChange(projectId: string, status: ProjectStatus) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      title: true,
      ownerUserId: true,
      reference: true,
    },
  });
  if (!project) return;

  const customerFacing: Partial<Record<ProjectStatus, string>> = {
    QUOTE_SENT: "Your quote is ready to review.",
    AWAITING_PAYMENT: "Your quote was approved. Payment is now due.",
    PAID: "We have received your payment and your project is queued for assignment.",
    IN_PROGRESS: "Work has started on your project.",
    QA_REVIEW: "Your document is in quality assurance.",
    COMPLETED: "Your project is complete.",
    DELIVERED: "Your final document is available to download.",
  };

  const body = customerFacing[status];
  if (!body) return;

  await notify(project.ownerUserId, {
    type: `project.${status.toLowerCase()}`,
    title: `${project.reference}: ${STATUS_LABELS[status]}`,
    body,
    link: `/dashboard/projects/${projectId}`,
  });
}
