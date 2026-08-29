import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { confirmPaymentManually } from "@/server/services/billing";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    return ok({ payment: await confirmPaymentManually(actor, id) });
  } catch (error) {
    return errorResponse(error);
  }
}
