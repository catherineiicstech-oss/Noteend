"use client";

import { useState } from "react";
import type { FileKind } from "@prisma/client";
import { Download, Lock } from "lucide-react";
import { Alert, Badge, Card, CardBody, CardHeader, EmptyState, Select } from "@/components/ui";
import { buttonStyles } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

export type ManagedFile = {
  id: string;
  filename: string;
  kind: FileKind;
  version: number;
  sizeBytes: number;
  customerVisible: boolean;
  createdAt: string;
};

const kindLabels: Record<FileKind, string> = {
  ORIGINAL: "Original",
  WORKING: "Working copy",
  EDITED: "Edited",
  QA: "QA copy",
  FINAL: "Final deliverable",
  REFERENCE: "Reference",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileManager({
  projectId,
  files,
  uploadKinds,
  canMarkCustomerVisible,
}: {
  projectId: string;
  files: ManagedFile[];
  uploadKinds: FileKind[];
  canMarkCustomerVisible: boolean;
}) {
  const [items, setItems] = useState(files);
  const [kind, setKind] = useState<FileKind | "">(uploadKinds[0] ?? "");
  const [customerVisible, setCustomerVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !kind) return;
    setPending(true);
    setError(null);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    setItems((current) => [
      ...current,
      {
        id: `${projectId}-demo-file-${current.length + 1}`,
        filename: file.name,
        kind,
        version: 1,
        sizeBytes: file.size,
        customerVisible,
        createdAt: new Date().toISOString(),
      },
    ]);
    setPending(false);
    event.target.value = "";
    setError("Demo upload added locally. It will reset when the page reloads.");
  }

  return (
    <Card>
      <CardHeader title="Documents" description="Stored privately and served through expiring links." />
      <CardBody className="space-y-4">
        {error ? <Alert tone="success">{error}</Alert> : null}

        {items.length ? (
          <ul className="divide-y divide-ink-50">
            {items.map((file) => (
              <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{file.filename}</p>
                  <p className="text-xs text-ink-500">
                    v{file.version} · {formatSize(file.sizeBytes)} ·{" "}
                    {formatDateTime(file.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={file.customerVisible ? "success" : "neutral"}>
                    {kindLabels[file.kind]}
                  </Badge>
                  {!file.customerVisible && canMarkCustomerVisible ? (
                    <span title="Internal only">
                      <Lock size={14} className="text-ink-400" aria-hidden />
                    </span>
                  ) : null}
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(`Demo preview for ${file.filename}`)}`}
                    download={file.filename}
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent-700 hover:text-accent-800"
                  >
                    <Download size={14} aria-hidden /> Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No documents yet" />
        )}

        {uploadKinds.length ? (
          <div className="flex flex-wrap items-end gap-3 border-t border-ink-100 pt-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-800">File type</span>
              <Select value={kind} onChange={(event) => setKind(event.target.value as FileKind)}>
                {uploadKinds.map((value) => (
                  <option key={value} value={value}>
                    {kindLabels[value]}
                  </option>
                ))}
              </Select>
            </label>
            {canMarkCustomerVisible ? (
              <label className="flex items-center gap-2 pb-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={customerVisible}
                  onChange={(event) => setCustomerVisible(event.target.checked)}
                />
                Visible to the customer
              </label>
            ) : null}
            <label className={buttonStyles({ variant: "outline", size: "sm", className: "cursor-pointer" })}>
              {pending ? "Uploading…" : "Upload file"}
              <input type="file" className="sr-only" onChange={upload} disabled={pending} />
            </label>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
