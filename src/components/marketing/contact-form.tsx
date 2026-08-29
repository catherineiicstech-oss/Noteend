"use client";

import { useState } from "react";
import { Alert, Card, CardBody, Field, Input, Select, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";

const topics = [
  "General enquiry",
  "Editing & proofreading",
  "Research & writing",
  "Business documentation",
  "Organisation / team account",
  "Careers",
];

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    if (response.ok) {
      setState("sent");
      event.currentTarget.reset();
    } else {
      const body = await response.json().catch(() => ({ error: "Something went wrong" }));
      setMessage(body.error ?? "Something went wrong");
      setState("error");
    }
  }

  return (
    <Card>
      <CardBody>
        {state === "sent" ? (
          <Alert tone="success">
            Thank you — your message has been received. Our team will reply by email.
          </Alert>
        ) : null}
        {state === "error" ? <Alert tone="danger">{message}</Alert> : null}

        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" required>
              <Input name="name" required autoComplete="name" />
            </Field>
            <Field label="Email address" required>
              <Input name="email" type="email" required autoComplete="email" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" hint="Optional">
              <Input name="phone" autoComplete="tel" />
            </Field>
            <Field label="Organisation" hint="Optional">
              <Input name="organization" autoComplete="organization" />
            </Field>
          </div>
          <Field label="Topic" required>
            <Select name="topic" required defaultValue={topics[0]}>
              {topics.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </Select>
          </Field>
          <Field label="Message" required>
            <Textarea name="message" required rows={6} minLength={10} />
          </Field>
          <Button type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Send message"}
          </Button>
          <p className="text-xs text-ink-500">
            Please do not attach confidential documents to this form. Use the quote wizard, which
            uploads files to private storage.
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
