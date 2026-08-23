import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { createQuote, draftQuoteFromPricing } from "@/server/services/quotes";

const manualSchema = z.object({
  fromPricing: z.literal(false).optional(),
  currency: z.string().length(3),
  notes: z.string().max(2000).optional(),
  discountMinor: z.coerce.number().int().min(0).default(0),
  taxMinor: z.coerce.number().int().min(0).default(0),
  validDays: z.coerce.number().int().min(1).max(90).default(14),
  items: z
    .array(
      z.object({
        description: z.string().min(1).max(300),
        quantity: z.coerce.number().min(0.01),
        unitPriceMinor: z.coerce.number().int().min(0),
      }),
    )
    .min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const payload = await request.json().catch(() => ({}));

    if (payload && typeof payload === "object" && "fromPricing" in payload && payload.fromPricing) {
      return ok({ quote: await draftQuoteFromPricing(actor, id) }, 201);
    }

    const input = manualSchema.parse(payload);
    return ok({ quote: await createQuote(actor, id, input) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
