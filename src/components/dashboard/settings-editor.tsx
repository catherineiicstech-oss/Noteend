"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Card, CardBody, CardHeader, Input } from "@/components/ui";
import { Button } from "@/components/ui/button";

/// Settings are stored as JSON, so the editor keeps the raw value and lets the
/// server validate it rather than pretending to know every shape.
export function SettingsEditor({ settings }: { settings: Record<string, unknown> }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [key, JSON.stringify(value)]),
    ),
  );
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(key: string) {
    setPending(key);
    setError(null);
    let value: unknown;
    try {
      value = JSON.parse(draft[key]);
    } catch {
      setPending(null);
      setError(`${key} must be valid JSON (numbers, "strings", true/false or objects)`);
      return;
    }
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setPending(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "The setting could not be saved");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Platform settings" description="Currency, tax, retention and workflow rules." />
      <CardBody className="space-y-3">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {Object.keys(draft)
          .sort()
          .map((key) => (
            <div key={key} className="flex flex-wrap items-end gap-3">
              <label className="min-w-0 flex-1 text-sm">
                <span className="mb-1 block font-medium text-ink-800">{key}</span>
                <Input
                  value={draft[key]}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [key]: event.target.value }))
                  }
                />
              </label>
              <Button size="sm" variant="outline" disabled={pending === key} onClick={() => save(key)}>
                {pending === key ? "Saving…" : "Save"}
              </Button>
            </div>
          ))}
      </CardBody>
    </Card>
  );
}
