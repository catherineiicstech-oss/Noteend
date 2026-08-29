import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { requireRole } from "@/server/auth/session";
import { recordAudit } from "@/server/services/audit";
import { getSettings, setSetting } from "@/server/services/settings";

const schema = z.object({ key: z.string().min(1).max(120), value: z.unknown() });

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN", "FINANCE", "PROJECT_MANAGER");
    return ok({ settings: await getSettings() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole("SUPER_ADMIN");
    const input = schema.parse(await request.json());
    await setSetting(input.key, input.value as never);
    await recordAudit({
      actorId: actor.id,
      action: "setting.update",
      resourceType: "Setting",
      resourceId: input.key,
    });
    return ok({ updated: true });
  } catch (error) {
    return errorResponse(error);
  }
}
