"use client";

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

/// Showcase actions are intentionally simulated: they demonstrate feedback
/// and confirmation states without requiring API routes or persistent data.
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
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);

  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setPending(true);
    setComplete(false);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    setPending(false);
    setComplete(true);
    onDone?.({ demo: true, endpoint, method, body });
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" variant={variant} size={size} disabled={pending} onClick={run}>
        {pending ? "Working…" : children}
      </Button>
      {complete ? <span className="text-xs text-accent-700">Demo action complete</span> : null}
    </span>
  );
}
