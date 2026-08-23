import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { assignStaff, unassignStaff } from "@/server/services/projects";

const assignSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["PROJECT_MANAGER", "EDITOR", "QA_REVIEWER"]),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const input = assignSchema.parse(await request.json());
    await assignStaff(actor, id, input.userId, input.role);
    return ok({ assigned: true }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const { assignmentId } = z.object({ assignmentId: z.string().min(1) }).parse(await request.json());
    await unassignStaff(actor, id, assignmentId);
    return ok({ removed: true });
  } catch (error) {
    return errorResponse(error);
  }
}
