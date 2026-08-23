import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { requireActor } from "@/server/auth/session";
import { authorizeFileAccess } from "@/server/services/files";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const { url } = await authorizeFileAccess(actor, id);
    return NextResponse.redirect(new URL(url, process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
  } catch (error) {
    return errorResponse(error);
  }
}
