import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { markNotificationRead } from "@/server/services/notifications";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    await markNotificationRead(actor.id, id);
    return ok({ read: true });
  } catch (error) {
    return errorResponse(error);
  }
}
