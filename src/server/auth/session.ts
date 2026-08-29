import type { OrgRole, SystemRole } from "@prisma/client";
import { demoActor } from "@/lib/demo-data";
import { HttpError } from "@/lib/errors";

export type Actor = {
  id: string;
  email: string;
  name: string;
  roles: SystemRole[];
  memberships: { organizationId: string; role: OrgRole }[];
};

/** The showcase is always signed in as a fully privileged demo user. */
export async function currentActor(): Promise<Actor> {
  return demoActor;
}

export async function requireActor(): Promise<Actor> {
  return demoActor;
}

export async function requireRole(...roles: SystemRole[]): Promise<Actor> {
  if (!roles.some((role) => demoActor.roles.includes(role))) {
    throw new HttpError(403, "The demo persona does not have access to this screen");
  }
  return demoActor;
}
