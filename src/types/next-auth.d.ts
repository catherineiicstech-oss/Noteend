import type { OrgRole, SystemRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

export type SessionMembership = {
  organizationId: string;
  role: OrgRole;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: SystemRole[];
      memberships: SessionMembership[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: SystemRole[];
    memberships?: SessionMembership[];
  }
}
