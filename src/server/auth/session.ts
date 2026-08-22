import { getServerSession } from "next-auth";
import type { OrgRole, SystemRole } from "@prisma/client";
import { authOptions } from "@/server/auth/options";
import { HttpError } from "@/lib/errors";

export type Actor = {
  id: string;
  email: string;
  name: string;
  roles: SystemRole[];
  memberships: { organizationId: string; role: OrgRole }[];
};

export async function currentActor(): Promise<Actor | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    roles: session.user.roles ?? [],
    memberships: session.user.memberships ?? [],
  };
}

export async function requireActor(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) throw new HttpError(401, "Authentication required");
  return actor;
}

export async function requireRole(...roles: SystemRole[]): Promise<Actor> {
  const actor = await requireActor();
  if (!roles.some((role) => actor.roles.includes(role))) {
    throw new HttpError(403, "You do not have access to this resource");
  }
  return actor;
}
