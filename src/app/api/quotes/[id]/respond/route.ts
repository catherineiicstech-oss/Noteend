import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { respondToQuote } from "@/server/services/quotes";

const schema = z.object({ decision: z.enum(["ACCEPT", "DECLINE"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const { decision } = schema.parse(await request.json());
    return ok({ quote: await respondToQuote(actor, id, decision) });
  } catch (error) {
    return errorResponse(error);
  }
}
