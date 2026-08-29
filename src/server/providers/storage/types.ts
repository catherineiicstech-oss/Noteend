export type StoredObject = {
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
};

export interface StorageProvider {
  readonly name: string;
  put(key: string, body: Buffer, mimeType: string): Promise<StoredObject>;
  /// Time-limited URL. Documents are never served from a public URL.
  signedDownloadUrl(key: string, filename: string): Promise<string>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
