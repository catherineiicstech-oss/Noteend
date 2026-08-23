import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { sendQuote } from "@/server/services/quotes";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    return ok({ quote: await sendQuote(actor, id) });
  } catch (error) {
    return errorResponse(error);
  }
}
