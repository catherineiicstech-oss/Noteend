import { MessageVisibility } from "@prisma/client";
import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { listMessages, postMessage } from "@/server/services/messages";

const schema = z.object({
  body: z.string().min(1).max(8000),
  visibility: z.nativeEnum(MessageVisibility).default(MessageVisibility.CUSTOMER),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    return ok({ messages: await listMessages(actor, id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const input = schema.parse(await request.json());
    const message = await postMessage(actor, id, input.body, input.visibility);
    return ok({ message }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
