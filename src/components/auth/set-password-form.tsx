"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, Field, Input } from "@/components/ui";
import { Button } from "@/components/ui/button";

export function SetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) {
      setPending(false);
      setError("The two passwords do not match");
      return;
    }
    const response = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });
    setPending(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "The password could not be set");
      return;
    }
    setDone(true);
    router.push("/login");
  }

  if (!token || !email) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl">Set your password</h1>
        <Alert tone="danger">This link is incomplete. Request a new one.</Alert>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-accent-700 hover:text-accent-800"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Set your password</h1>
        <p className="mt-1 text-sm text-ink-500">For {email}</p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {done ? <Alert tone="success">Password saved. Taking you to sign in…</Alert> : null}

      <form onSubmit={submit} className="space-y-4">
        <Field label="New password" hint="At least 10 characters." required>
          <Input name="password" type="password" required minLength={10} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password" required>
          <Input name="confirm" type="password" required minLength={10} autoComplete="new-password" />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </div>
  );
}
