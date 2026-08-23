import { ProjectStatus } from "@prisma/client";
import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { transitionProject } from "@/server/services/projects";

const schema = z.object({
  status: z.nativeEnum(ProjectStatus),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const input = schema.parse(await request.json());
    await transitionProject(actor, id, input.status, { reason: input.reason });
    return ok({ status: input.status });
  } catch (error) {
    return errorResponse(error);
  }
}
