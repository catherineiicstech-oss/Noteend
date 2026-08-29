"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MessageVisibility } from "@prisma/client";
import { Alert, Badge, Card, CardBody, CardHeader, EmptyState, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

export type ThreadMessage = {
  id: string;
  body: string;
  visibility: MessageVisibility;
  createdAt: string;
  author: { name: string } | null;
};

export function MessageThread({
  projectId,
  messages,
  canPostInternal,
}: {
  projectId: string;
  messages: ThreadMessage[];
  canPostInternal: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<MessageVisibility>("CUSTOMER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    const response = await fetch(`/api/projects/${projectId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, visibility }),
    });
    setPending(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "Message not sent");
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Messages"
        description={
          canPostInternal
            ? "Internal notes stay with the team and are never shown to the customer."
            : "Talk to the team handling your project."
        }
      />
      <CardBody className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        {messages.length ? (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li
                key={message.id}
                className={
                  message.visibility === "INTERNAL"
                    ? "rounded-lg border border-amber-200 bg-amber-50 p-3"
                    : "rounded-lg border border-ink-100 p-3"
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-900">
                    {message.author?.name ?? "System"}
                  </span>
                  <span className="text-xs text-ink-400">{formatDateTime(message.createdAt)}</span>
                  {message.visibility === "INTERNAL" ? (
                    <Badge tone="warning">Internal note</Badge>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">{message.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No messages yet" />
        )}

        <form onSubmit={send} className="space-y-3 border-t border-ink-100 pt-4">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            placeholder="Write a message…"
            aria-label="Message"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {canPostInternal ? (
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={visibility === "INTERNAL"}
                  onChange={(event) =>
                    setVisibility(event.target.checked ? "INTERNAL" : "CUSTOMER")
                  }
                />
                Internal note (hidden from the customer)
              </label>
            ) : (
              <span />
            )}
            <Button type="submit" size="sm" disabled={pending || !body.trim()}>
              {pending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
