import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { updateChecklistItem } from "@/server/services/qa";

const schema = z.object({
  checked: z.boolean().optional(),
  note: z.string().max(1000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const input = schema.parse(await request.json());
    return ok({ item: await updateChecklistItem(actor, id, input) });
  } catch (error) {
    return errorResponse(error);
  }
}
