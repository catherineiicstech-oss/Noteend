import { OrgRole } from "@prisma/client";
import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { inviteMember, removeMember, updateMemberRole } from "@/server/services/organizations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const input = z
      .object({ email: z.string().email(), role: z.nativeEnum(OrgRole).default(OrgRole.MEMBER) })
      .parse(await request.json());
    const invitation = await inviteMember(actor, id, input.email, input.role);
    return ok({ invitation }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const input = z
      .object({ memberId: z.string().min(1), role: z.nativeEnum(OrgRole) })
      .parse(await request.json());
    return ok({ member: await updateMemberRole(actor, id, input.memberId, input.role) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const input = z.object({ memberId: z.string().min(1) }).parse(await request.json());
    await removeMember(actor, id, input.memberId);
    return ok({ removed: true });
  } catch (error) {
    return errorResponse(error);
  }
}
