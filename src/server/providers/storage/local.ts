import { createHmac } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import type { StorageProvider, StoredObject } from "./types";

/// Filesystem-backed storage for development and CI. Downloads still go through
/// a signed, expiring URL so the access path matches production.
export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";

  private resolve(key: string): string {
    const root = path.resolve(env().LOCAL_STORAGE_DIR);
    const target = path.resolve(root, key);
    if (!target.startsWith(root + path.sep)) {
      throw new Error("Refusing to access a path outside the storage root");
    }
    return target;
  }

  async put(key: string, body: Buffer, mimeType: string): Promise<StoredObject> {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    return { storageKey: key, sizeBytes: body.byteLength, mimeType };
  }

  async signedDownloadUrl(key: string, filename: string): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + env().S3_SIGNED_URL_TTL;
    const signature = signLocalKey(key, expires);
    const params = new URLSearchParams({
      key,
      expires: String(expires),
      signature,
      filename,
    });
    return `/api/files/local?${params.toString()}`;
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}

export function signLocalKey(key: string, expires: number): string {
  return createHmac("sha256", env().NEXTAUTH_SECRET)
    .update(`${key}:${expires}`)
    .digest("hex");
}

export function verifyLocalSignature(
  key: string,
  expires: number,
  signature: string,
): boolean {
  if (Number.isNaN(expires) || expires * 1000 < Date.now()) return false;
  const expected = signLocalKey(key, expires);
  return expected.length === signature.length && expected === signature;
}
