"use client";

import { useState } from "react";
import type { QAOutcome } from "@prisma/client";
import { Alert, Badge, Card, CardBody, CardHeader, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

export type QaChecklistItem = {
  id: string;
  section: string;
  label: string;
  checked: boolean;
};

export type QaReview = {
  id: string;
  outcome: QAOutcome | null;
  comments: string | null;
  submittedAt: string | null;
  createdAt: string;
  reviewer: { name: string };
  items: QaChecklistItem[];
};

export function QaPanel({
  projectId,
  reviews,
  canReview,
  canStart,
}: {
  projectId: string;
  reviews: QaReview[];
  canReview: boolean;
  canStart: boolean;
}) {
  const [comments, setComments] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = reviews.find((review) => !review.submittedAt);

  async function call(endpoint: string, init: RequestInit) {
    setPending(true);
    setError(null);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    setPending(false);
    setError("Demo QA action saved locally.");
    void endpoint;
    void init;
    return true;
  }

  return (
    <Card>
      <CardHeader
        title="Quality assurance"
        description="Premium work must pass a checklist review before it can be completed."
      />
      <CardBody className="space-y-4">
        {error ? <Alert tone="success">{error}</Alert> : null}

        {open && canReview ? (
          <div className="space-y-3">
            <ul className="space-y-2">
              {open.items.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    defaultChecked={item.checked}
                    disabled={pending}
                    onChange={(event) =>
                      void call(`/api/qa/items/${item.id}`, {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ checked: event.target.checked }),
                      })
                    }
                  />
                  <span>
                    <span className="text-xs uppercase tracking-wide text-ink-400">
                      {item.section}
                    </span>
                    <span className="block text-ink-700">{item.label}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Textarea
              rows={3}
              value={comments}
              placeholder="Reviewer comments"
              aria-label="Reviewer comments"
              onChange={(event) => setComments(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {(["PASS", "NEEDS_REVISION", "FAIL"] as QAOutcome[]).map((outcome) => (
                <Button
                  key={outcome}
                  size="sm"
                  variant={outcome === "PASS" ? "primary" : "outline"}
                  disabled={pending}
                  onClick={() =>
                    void call(`/api/qa/reviews/${open.id}/submit`, {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ outcome, comments: comments || undefined }),
                    })
                  }
                >
                  {outcome === "PASS"
                    ? "Pass review"
                    : outcome === "NEEDS_REVISION"
                      ? "Send back for revision"
                      : "Fail review"}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {!open && canStart ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              void call("/api/qa/reviews", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ projectId }),
              })
            }
          >
            Start QA review
          </Button>
        ) : null}

        {reviews.filter((review) => review.submittedAt).length ? (
          <ul className="space-y-2 border-t border-ink-100 pt-4">
            {reviews
              .filter((review) => review.submittedAt)
              .map((review) => (
                <li key={review.id} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={review.outcome === "PASS" ? "success" : "warning"}>
                      {review.outcome?.replace("_", " ").toLowerCase()}
                    </Badge>
                    <span className="text-ink-700">{review.reviewer.name}</span>
                    <span className="text-xs text-ink-400">
                      {review.submittedAt ? formatDateTime(review.submittedAt) : null}
                    </span>
                  </div>
                  {review.comments ? (
                    <p className="mt-1 text-ink-600">{review.comments}</p>
                  ) : null}
                </li>
              ))}
          </ul>
        ) : null}

        {!open && !canStart && !reviews.length ? (
          <p className="text-sm text-ink-500">No QA review has been started for this project.</p>
        ) : null}
      </CardBody>
    </Card>
  );
}
