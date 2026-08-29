import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { createOrganization } from "@/server/services/organizations";

const schema = z.object({
  name: z.string().min(2).max(160),
  industry: z.string().max(120).optional(),
  country: z.string().max(80).optional(),
  billingEmail: z.string().email().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    const input = schema.parse(await request.json());
    const organization = await createOrganization(actor, {
      ...input,
      billingEmail: input.billingEmail || undefined,
    });
    return ok({ organization }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
