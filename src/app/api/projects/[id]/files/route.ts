import { FileKind } from "@prisma/client";
import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { requireActor } from "@/server/auth/session";
import { uploadProjectFile } from "@/server/services/files";

const schema = z.object({
  kind: z.nativeEnum(FileKind),
  note: z.string().max(500).optional(),
  customerVisible: z.boolean().default(false),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ValidationError("Choose a file to upload");

    const input = schema.parse({
      kind: form.get("kind"),
      note: form.get("note") || undefined,
      customerVisible: form.get("customerVisible") === "true",
    });

    const stored = await uploadProjectFile(actor, id, file, input);
    return ok({ file: { id: stored.id, filename: stored.filename } }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
