"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Field, Input } from "@/components/ui";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const email = new FormData(event.currentTarget).get("email");
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setPending(false);
    setSent(true);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Forgot your password</h1>
        <p className="mt-1 text-sm text-ink-500">
          We will email you a link to choose a new one.
        </p>
      </div>

      {sent ? (
        <Alert tone="success">
          If an account exists for that address, a reset link is on its way. The link expires in
          72 hours.
        </Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email address" required>
            <Input name="email" type="email" required autoComplete="email" />
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="text-sm text-ink-500">
        <Link href="/login" className="font-medium text-accent-700 hover:text-accent-800">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
