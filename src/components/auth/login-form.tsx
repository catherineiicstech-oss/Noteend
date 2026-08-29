"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, Card, CardBody, Field, Input } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";

export function LoginForm() {
  const params = useSearchParams();

  return (
    <Card>
      <CardBody className="p-6">
        <h1 className="text-2xl">Open the showcase</h1>
        <p className="mt-1 text-sm text-ink-600">
          Enter a pre-filled administrator workspace—no account or database needed.
        </p>

        {params.get("registered") ? (
          <div className="mt-4">
            <Alert tone="success">Demo account created. Continue to the dashboard.</Alert>
          </div>
        ) : null}

        <div className="mt-6 space-y-4" aria-label="Demo account preview">
          <Field label="Email address">
            <Input type="email" value="demo@scriptor.ug" readOnly />
          </Field>
          <Field label="Workspace role">
            <Input value="Administrator demo" readOnly />
          </Field>
          <ButtonLink href="/dashboard" className="w-full">
            Enter demo dashboard
          </ButtonLink>
        </div>

        <p className="mt-5 text-sm text-ink-600">
          Want to keep browsing the public site?{" "}
          <Link href="/" className="font-medium text-accent-700 hover:text-accent-800">
            Return home
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
