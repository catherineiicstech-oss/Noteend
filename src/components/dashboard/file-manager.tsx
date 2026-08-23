"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [kind, setKind] = useState<FileKind | "">(uploadKinds[0] ?? "");
  const [customerVisible, setCustomerVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !kind) return;
    setPending(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("kind", kind);
    form.set("customerVisible", String(customerVisible));

    const response = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      body: form,
    });
    setPending(false);
    event.target.value = "";
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Documents" description="Stored privately and served through expiring links." />
      <CardBody className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        {files.length ? (
          <ul className="divide-y divide-ink-50">
            {files.map((file) => (
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
                    href={`/api/files/${file.id}/download`}
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
