import { QAOutcome } from "@prisma/client";
import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { submitQaReview } from "@/server/services/qa";

const schema = z.object({
  outcome: z.nativeEnum(QAOutcome),
  comments: z.string().max(4000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const input = schema.parse(await request.json());
    return ok({ review: await submitQaReview(actor, id, input.outcome, input.comments) });
  } catch (error) {
    return errorResponse(error);
  }
}
