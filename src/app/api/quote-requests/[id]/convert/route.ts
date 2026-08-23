import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { convertToProject } from "@/server/services/quote-requests";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const project = await convertToProject(actor, id);
    return ok({ projectId: project.id, reference: project.reference }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
