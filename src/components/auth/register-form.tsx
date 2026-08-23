"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Card, CardBody, Field, Input } from "@/components/ui";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        phone: form.get("phone") ?? "",
        country: form.get("country") ?? "",
        acceptedTerms: form.get("acceptedTerms") === "on",
      }),
    });
    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "We could not create your account.");
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <Card>
      <CardBody className="p-6">
        <h1 className="text-2xl">Create an account</h1>
        <p className="mt-1 text-sm text-ink-600">
          Track quotes, upload documents securely and manage your projects.
        </p>

        {error ? (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label="Full name" required>
            <Input name="name" required autoComplete="name" minLength={2} />
          </Field>
          <Field label="Email address" required>
            <Input name="email" type="email" required autoComplete="email" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" hint="Optional">
              <Input name="phone" autoComplete="tel" />
            </Field>
            <Field label="Country" hint="Optional">
              <Input name="country" autoComplete="country-name" defaultValue="Uganda" />
            </Field>
          </div>
          <Field label="Password" required hint="At least 10 characters">
            <Input
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
            />
          </Field>
          <label className="flex items-start gap-2 text-sm text-ink-600">
            <input type="checkbox" name="acceptedTerms" required className="mt-1" />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms" className="text-accent-700 underline">
                terms of service
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="text-accent-700 underline">
                privacy policy
              </Link>
              .
            </span>
          </label>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
