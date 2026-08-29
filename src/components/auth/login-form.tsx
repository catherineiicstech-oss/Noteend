"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Alert, Card, CardBody, Field, Input } from "@/components/ui";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("Those details did not match an account.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <Card>
      <CardBody className="p-6">
        <h1 className="text-2xl">Sign in</h1>
        <p className="mt-1 text-sm text-ink-600">Access your projects, quotes and invoices.</p>

        {params.get("registered") ? (
          <div className="mt-4">
            <Alert tone="success">Your account is ready. Sign in to continue.</Alert>
          </div>
        ) : null}
        {error ? (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label="Email address" required>
            <Input name="email" type="email" required autoComplete="email" autoFocus />
          </Field>
          <Field label="Password" required>
            <Input name="password" type="password" required autoComplete="current-password" />
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-ink-600">
          <Link
            href="/forgot-password"
            className="font-medium text-accent-700 hover:text-accent-800"
          >
            Forgot your password?
          </Link>
        </p>

        <p className="mt-2 text-sm text-ink-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-accent-700 hover:text-accent-800">
            Create one
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
