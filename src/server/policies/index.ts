import type {
  FileKind,
  MessageVisibility,
  OrgRole,
  Project,
  ProjectAssignment,
  ProjectFile,
  SystemRole,
} from "@prisma/client";
import type { Actor } from "@/server/auth/session";
import { ForbiddenError } from "@/lib/errors";

export type ProjectContext = Pick<
  Project,
  "id" | "ownerUserId" | "organizationId" | "status" | "isPremium"
> & {
  assignments: Pick<ProjectAssignment, "userId" | "role" | "unassignedAt">[];
};

export function hasRole(actor: Actor, ...roles: SystemRole[]): boolean {
  return roles.some((role) => actor.roles.includes(role));
}

export function isSuperAdmin(actor: Actor): boolean {
  return actor.roles.includes("SUPER_ADMIN");
}

export function isStaff(actor: Actor): boolean {
  return hasRole(
    actor,
    "PROJECT_MANAGER",
    "EDITOR",
    "QA_REVIEWER",
    "FINANCE",
    "SUPER_ADMIN",
  );
}

export function orgRole(actor: Actor, organizationId: string | null): OrgRole | null {
  if (!organizationId) return null;
  return (
    actor.memberships.find((entry) => entry.organizationId === organizationId)?.role ?? null
  );
}

export function isOrgAdmin(actor: Actor, organizationId: string | null): boolean {
  const role = orgRole(actor, organizationId);
  return role === "OWNER" || role === "ADMIN";
}

function activeAssignment(actor: Actor, project: ProjectContext) {
  return project.assignments.find(
    (assignment) => assignment.userId === actor.id && assignment.unassignedAt === null,
  );
}

/// True when the actor is a staff member currently assigned to the project.
export function isAssigned(actor: Actor, project: ProjectContext): boolean {
  return Boolean(activeAssignment(actor, project));
}

export function isCustomerSide(actor: Actor, project: ProjectContext): boolean {
  if (project.ownerUserId === actor.id) return true;
  return orgRole(actor, project.organizationId) !== null;
}

export function canViewProject(actor: Actor, project: ProjectContext): boolean {
  if (isSuperAdmin(actor)) return true;
  if (hasRole(actor, "PROJECT_MANAGER", "FINANCE")) return true;
  if (isStaff(actor)) return isAssigned(actor, project);
  return isCustomerSide(actor, project);
}

export function canManageProject(actor: Actor, project: ProjectContext): boolean {
  if (isSuperAdmin(actor)) return true;
  return hasRole(actor, "PROJECT_MANAGER") || isAssigned(actor, project);
}

export function canAssignStaff(actor: Actor): boolean {
  return hasRole(actor, "PROJECT_MANAGER", "SUPER_ADMIN");
}

export function canApproveQuote(actor: Actor, project: ProjectContext): boolean {
  if (isSuperAdmin(actor)) return true;
  if (project.organizationId) return isOrgAdmin(actor, project.organizationId);
  return project.ownerUserId === actor.id;
}

export function canSubmitEditorWork(actor: Actor, project: ProjectContext): boolean {
  if (isSuperAdmin(actor)) return true;
  const assignment = activeAssignment(actor, project);
  return assignment?.role === "EDITOR";
}

export function canReviewQA(actor: Actor, project: ProjectContext): boolean {
  if (isSuperAdmin(actor)) return true;
  const assignment = activeAssignment(actor, project);
  return assignment?.role === "QA_REVIEWER";
}

/// Internal notes are never visible to anyone on the customer side.
export function visibleMessageScopes(
  actor: Actor,
  project: ProjectContext,
): MessageVisibility[] {
  if (isSuperAdmin(actor)) return ["CUSTOMER", "INTERNAL"];
  if (isStaff(actor) && (isAssigned(actor, project) || hasRole(actor, "PROJECT_MANAGER"))) {
    return ["CUSTOMER", "INTERNAL"];
  }
  return ["CUSTOMER"];
}

export function canPostInternalNote(actor: Actor, project: ProjectContext): boolean {
  return visibleMessageScopes(actor, project).includes("INTERNAL");
}

/// Customers only ever reach files explicitly marked customer-visible.
export function canDownloadFile(
  actor: Actor,
  project: ProjectContext,
  file: Pick<ProjectFile, "kind" | "customerVisible">,
): boolean {
  if (isSuperAdmin(actor)) return true;
  if (isStaff(actor)) {
    if (hasRole(actor, "PROJECT_MANAGER")) return true;
    return isAssigned(actor, project);
  }
  if (!isCustomerSide(actor, project)) return false;
  return file.customerVisible;
}

export function canUploadFileKind(
  actor: Actor,
  project: ProjectContext,
  kind: FileKind,
): boolean {
  if (isSuperAdmin(actor)) return true;
  const assignment = activeAssignment(actor, project);
  if (hasRole(actor, "PROJECT_MANAGER")) return true;
  if (assignment?.role === "EDITOR") return kind === "WORKING" || kind === "EDITED";
  if (assignment?.role === "QA_REVIEWER") return kind === "QA" || kind === "FINAL";
  if (isCustomerSide(actor, project)) return kind === "ORIGINAL" || kind === "REFERENCE";
  return false;
}

export function canManagePricing(actor: Actor): boolean {
  return hasRole(actor, "FINANCE", "SUPER_ADMIN");
}

export function canManageUsers(actor: Actor): boolean {
  return isSuperAdmin(actor);
}

export function canManageContent(actor: Actor): boolean {
  return hasRole(actor, "SUPER_ADMIN", "PROJECT_MANAGER");
}

export function canViewOrganization(actor: Actor, organizationId: string): boolean {
  if (isSuperAdmin(actor) || hasRole(actor, "PROJECT_MANAGER", "FINANCE")) return true;
  return orgRole(actor, organizationId) !== null;
}

export function canManageOrganization(actor: Actor, organizationId: string): boolean {
  if (isSuperAdmin(actor)) return true;
  return isOrgAdmin(actor, organizationId);
}

export function assertPermission(allowed: boolean, message?: string): void {
  if (!allowed) throw new ForbiddenError(message);
}
