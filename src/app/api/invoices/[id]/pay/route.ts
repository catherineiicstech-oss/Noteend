import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { startPayment } from "@/server/services/billing";

const schema = z.object({
  provider: z.string().min(1).default("manual"),
  method: z.string().min(1).default("default"),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const input = schema.parse(await request.json().catch(() => ({})));
    const result = await startPayment(actor, id, input.provider, input.method);
    return ok(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
