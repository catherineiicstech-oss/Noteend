import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { currentActor } from "@/server/auth/session";
import { submitQuoteRequest } from "@/server/services/quote-requests";
import { ValidationError } from "@/lib/errors";

const schema = z.object({
  contactName: z.string().min(2).max(120),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(40).optional(),
  organizationName: z.string().max(160).optional(),
  country: z.string().max(80).optional(),
  preferredContact: z.enum(["EMAIL", "PHONE", "WHATSAPP"]).default("EMAIL"),
  serviceId: z.string().optional(),
  serviceOther: z.string().max(160).optional(),
  documentType: z.string().max(160).optional(),
  wordCount: z.coerce.number().int().min(1).max(2_000_000),
  complexity: z.enum(["STANDARD", "TECHNICAL", "SPECIALIST"]).default("STANDARD"),
  deadline: z.coerce.date(),
  citationStyle: z.string().max(60).optional(),
  industry: z.string().max(120).optional(),
  confidentiality: z.string().max(200).optional(),
  needsFormatting: z.coerce.boolean().default(false),
  needsResearch: z.coerce.boolean().default(false),
  description: z.string().min(10).max(8000),
});

const MAX_FILES = 10;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((entry): entry is File => entry instanceof File);
    if (files.length > MAX_FILES) {
      throw new ValidationError(`You can attach up to ${MAX_FILES} files`);
    }

    const raw = Object.fromEntries(
      [...form.entries()].filter(([key]) => key !== "files"),
    ) as Record<string, string>;

    const input = schema.parse({
      ...raw,
      needsFormatting: raw.needsFormatting === "true",
      needsResearch: raw.needsResearch === "true",
    });

    if (!input.serviceId && !input.serviceOther) {
      throw new ValidationError("Choose a service or describe what you need");
    }
    if (input.deadline.getTime() < Date.now()) {
      throw new ValidationError("The deadline must be in the future");
    }

    const actor = await currentActor();
    const created = await submitQuoteRequest(
      {
        ...input,
        userId: actor?.id ?? null,
        organizationId: actor?.memberships[0]?.organizationId ?? null,
      },
      files,
    );

    return ok(
      {
        reference: created.reference,
        estimateMinor: created.estimateMinor,
        estimateCurrency: created.estimateCurrency,
      },
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
