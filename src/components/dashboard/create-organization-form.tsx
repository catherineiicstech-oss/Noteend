"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Field, Input } from "@/components/ui";
import { Button } from "@/components/ui/button";

export function CreateOrganizationForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    setPending(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "The organisation could not be created");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="Organisation name" required>
        <Input name="name" required minLength={2} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Industry">
          <Input name="industry" />
        </Field>
        <Field label="Country">
          <Input name="country" defaultValue="Uganda" />
        </Field>
      </div>
      <Field label="Billing email">
        <Input name="billingEmail" type="email" />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create organisation"}
      </Button>
    </form>
  );
}
