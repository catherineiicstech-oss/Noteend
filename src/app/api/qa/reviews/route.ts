import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { startQaReview } from "@/server/services/qa";

const schema = z.object({ projectId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    const { projectId } = schema.parse(await request.json());
    return ok({ review: await startQaReview(actor, projectId) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
