import { env } from "@/lib/env";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";
import type { StorageProvider } from "./types";

let provider: StorageProvider | undefined;

export function storage(): StorageProvider {
  if (!provider) {
    provider = env().STORAGE_DRIVER === "local" ? new LocalStorageProvider() : new S3StorageProvider();
  }
  return provider;
}

export type { StorageProvider, StoredObject } from "./types";
