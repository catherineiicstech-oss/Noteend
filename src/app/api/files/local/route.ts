import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyLocalSignature } from "@/server/providers/storage/local";

/// Serves development storage downloads. Production uses S3 signed URLs and
/// never reaches this route.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const expires = Number(url.searchParams.get("expires"));
  const signature = url.searchParams.get("signature");
  const filename = url.searchParams.get("filename") ?? "download";

  if (!key || !signature || !verifyLocalSignature(key, expires, signature)) {
    return NextResponse.json({ error: "This download link is invalid or expired" }, { status: 403 });
  }

  const root = path.resolve(env().LOCAL_STORAGE_DIR);
  const target = path.resolve(root, key);
  if (!target.startsWith(root + path.sep)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const body = await readFile(target);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
    },
  });
}
