import type { OrgRole, SystemRole } from "@prisma/client";
import type { Actor } from "@/server/auth/session";
import type { ProjectContext } from "@/server/policies";

export function actor(
  overrides: Partial<Actor> & { id?: string } = {},
): Actor {
  return {
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    roles: [] as SystemRole[],
    memberships: [] as { organizationId: string; role: OrgRole }[],
    ...overrides,
  } as Actor;
}

export function project(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return {
    id: "project-1",
    ownerUserId: "owner-1",
    organizationId: null,
    status: "IN_PROGRESS",
    isPremium: false,
    assignments: [],
    ...overrides,
  };
}
