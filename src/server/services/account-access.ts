import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/server/db";
import { env } from "@/lib/env";
import { ValidationError } from "@/lib/errors";
import { hashPassword } from "@/server/auth/password";
import { recordAudit } from "@/server/services/audit";
import { queueEmail } from "@/server/services/notifications";
import { siteConfig } from "@/lib/site";

const TOKEN_TTL_HOURS = 72;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/// Issues a single-use link that lets someone set a password: either a guest
/// whose account was created when their quote request was converted, or an
/// existing customer who has forgotten their password. Only the hash is
/// stored, so a database read cannot be replayed as a login.
export async function issuePasswordSetupToken(
  email: string,
  reason: "CLAIM" | "RESET",
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;

  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 3_600_000);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token: hashToken(token), expires },
  });

  const url = `${env().NEXTAUTH_URL}/set-password?token=${token}&email=${encodeURIComponent(email)}`;
  await queueEmail(
    email,
    reason === "CLAIM"
      ? `Set a password for your ${siteConfig.name} account`
      : `Reset your ${siteConfig.name} password`,
    reason === "CLAIM"
      ? `We have created an account so you can follow your project, download deliverables and message the team.\n\nSet your password here (the link expires in ${TOKEN_TTL_HOURS} hours):\n${url}`
      : `Use this link to choose a new password (it expires in ${TOKEN_TTL_HOURS} hours):\n${url}\n\nIf you did not ask for this, you can ignore this email.`,
  );
}

export async function completePasswordSetup(
  email: string,
  token: string,
  password: string,
): Promise<void> {
  const record = await prisma.verificationToken.findUnique({
    where: { token: hashToken(token) },
  });
  if (!record || record.identifier !== email || record.expires < new Date()) {
    throw new ValidationError("This link has expired. Request a new one.");
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new ValidationError("This link has expired. Request a new one.");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password), emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
  ]);

  await recordAudit({
    actorId: user.id,
    action: "user.password_set",
    resourceType: "User",
    resourceId: user.id,
  });
}
