import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { Provider } from "next-auth/providers/index";
import type { SystemRole } from "@prisma/client";
import { prisma } from "@/server/db";
import { verifyPassword } from "@/server/auth/password";
import { recordAudit } from "@/server/services/audit";

function oauthProviders(): Provider[] {
  const providers: Provider[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }
  if (
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  ) {
    providers.push(
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        tenantId: process.env.AZURE_AD_TENANT_ID,
      }),
    );
  }
  return providers;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { roles: true },
        });
        if (!user?.passwordHash || !user.isActive) return null;

        const valid = await verifyPassword(user.passwordHash, password);
        if (!valid) {
          await recordAudit({
            action: "auth.login_failed",
            resourceType: "User",
            resourceId: user.id,
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        await recordAudit({
          actorId: user.id,
          action: "auth.login",
          resourceType: "User",
          resourceId: user.id,
        });

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    ...oauthProviders(),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;
      if (!userId) return token;

      // Roles and memberships are re-read on every refresh so that revoking
      // access takes effect without waiting for the session to expire.
      const record = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true, memberships: true },
      });
      if (!record || !record.isActive) return { ...token, roles: [] };

      token.sub = record.id;
      token.name = record.name;
      token.email = record.email;
      token.roles = record.roles.map((entry) => entry.role);
      token.memberships = record.memberships.map((entry) => ({
        organizationId: entry.organizationId,
        role: entry.role,
      }));
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.roles = (token.roles as SystemRole[]) ?? [];
        session.user.memberships = token.memberships ?? [];
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await prisma.userRole.create({
        data: { userId: user.id, role: "CUSTOMER" },
      });
    },
  },
};
