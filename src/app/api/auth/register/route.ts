import { z } from "zod";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { recordAudit } from "@/server/services/audit";
import { queueEmail } from "@/server/services/notifications";
import { errorResponse, ok } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { siteConfig } from "@/lib/site";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(10, "Use at least 10 characters").max(200),
  phone: z.string().max(40).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  acceptedTerms: z.literal(true, { message: "You must accept the terms" }),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ValidationError("An account with this email already exists");
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: input.name.trim(),
        phone: input.phone || null,
        country: input.country || null,
        passwordHash: await hashPassword(input.password),
        roles: { create: { role: "CUSTOMER" } },
      },
    });

    await recordAudit({
      actorId: user.id,
      action: "user.register",
      resourceType: "User",
      resourceId: user.id,
    });

    await queueEmail(
      email,
      `Welcome to ${siteConfig.name}`,
      `Hello ${user.name},\n\nYour account is ready. You can now request quotes, upload documents and track your projects.\n\n${siteConfig.url}/dashboard`,
    );

    return ok({ id: user.id }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
