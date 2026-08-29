"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type Props = {
  endpoint: string;
  body?: unknown;
  method?: "POST" | "PATCH" | "DELETE";
  confirm?: string;
  children: React.ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  onDone?: (payload: unknown) => void;
};

/// Small client wrapper so server-rendered pages can trigger a service-layer
/// mutation and refresh without each screen re-implementing fetch handling.
export function ActionButton({
  endpoint,
  body,
  method = "POST",
  confirm,
  children,
  variant,
  size = "sm",
  onDone,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setPending(true);
    setError(null);
    const response = await fetch(endpoint, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "That action could not be completed");
      return;
    }
    onDone?.(payload);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" variant={variant} size={size} disabled={pending} onClick={run}>
        {pending ? "Working…" : children}
      </Button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
