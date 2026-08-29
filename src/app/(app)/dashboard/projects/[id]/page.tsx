import { notFound } from "next/navigation";
import { FileKind, ProjectStatus, QuoteStatus } from "@prisma/client";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { AssignmentPanel } from "@/components/dashboard/assignment-panel";
import { FileManager } from "@/components/dashboard/file-manager";
import { MessageThread } from "@/components/dashboard/message-thread";
import { QaPanel } from "@/components/dashboard/qa-panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireActor } from "@/server/auth/session";
import {
  canManageProject,
  canReviewQA,
  canSubmitEditorWork,
  hasRole,
  isStaff,
} from "@/server/policies";
import { getProjectForActor, loadProjectContext } from "@/server/services/projects";
import { listMessages } from "@/server/services/messages";
import { ALLOWED_TRANSITIONS, CUSTOMER_TRACKER_STEPS, STATUS_LABELS, trackerIndex } from "@/server/services/workflow";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { demoProject, demoProjects, demoStaff } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

/// Transitions staff drive by hand. Payment, quote and QA outcomes move the
/// project automatically, so they are deliberately excluded here.
const manualTransitions: ProjectStatus[] = [
  ProjectStatus.AWAITING_ASSIGNMENT,
  ProjectStatus.ASSIGNED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.EDITOR_SUBMITTED,
  ProjectStatus.QA_REVIEW,
  ProjectStatus.FINAL_REVIEW,
  ProjectStatus.COMPLETED,
  ProjectStatus.DELIVERED,
  ProjectStatus.CLOSED,
  ProjectStatus.CANCELLED,
];

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireActor();

  const demoSummary = demoProjects.find((item) => item.id === id);
  const project = actor.id === "demo-admin"
    ? demoSummary
      ? { ...demoProject, ...demoSummary }
      : null
    : await getProjectForActor(actor, id).catch(() => null);
  if (!project) notFound();

  const context = actor.id === "demo-admin"
    ? {
        id: project.id,
        ownerUserId: project.owner.id,
        organizationId: project.organization?.id ?? null,
        status: project.status,
        isPremium: project.isPremium,
        assignments: project.assignments.map((assignment) => ({
          userId: assignment.user.id,
          role: assignment.role,
          unassignedAt: null,
        })),
      }
    : await loadProjectContext(project.id);
  const messages = actor.id === "demo-admin" ? demoProject.messages : await listMessages(actor, project.id);
  const staff = isStaff(actor);
  const manages = canManageProject(actor, context);
  const isEditor = canSubmitEditorWork(actor, context);
  const reviewsQa = canReviewQA(actor, context);

  const staffOptions = manages ? demoStaff : [];

  const uploadKinds: FileKind[] = manages
    ? [FileKind.ORIGINAL, FileKind.REFERENCE, FileKind.WORKING, FileKind.EDITED, FileKind.FINAL]
    : isEditor
      ? [FileKind.WORKING, FileKind.EDITED]
      : reviewsQa
        ? [FileKind.QA]
        : [FileKind.ORIGINAL, FileKind.REFERENCE];

  const step = trackerIndex(project.status);
  const latestQuote = project.quotes[0];
  const nextStatuses = ALLOWED_TRANSITIONS[project.status].filter((status) =>
    manualTransitions.includes(status),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl">{project.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {project.reference} · {project.service.name} · due {formatDate(project.deadline)}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <Card>
        <CardBody>
          <ol className="flex flex-wrap gap-2">
            {CUSTOMER_TRACKER_STEPS.map((tracker, index) => (
              <li
                key={tracker.label}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium",
                  index < step
                    ? "bg-accent-50 text-accent-700"
                    : index === step
                      ? "bg-ink-900 text-white"
                      : "bg-ink-100 text-ink-500",
                )}
                aria-current={index === step ? "step" : undefined}
              >
                {tracker.label}
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Brief" />
            <CardBody>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-400">Document type</dt>
                  <dd className="text-sm text-ink-800">{project.documentType ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-400">Word count</dt>
                  <dd className="text-sm text-ink-800">{project.wordCount.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-400">Complexity</dt>
                  <dd className="text-sm text-ink-800">{project.complexity.toLowerCase()}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-400">Citation style</dt>
                  <dd className="text-sm text-ink-800">{project.citationStyle ?? "—"}</dd>
                </div>
                {staff ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-400">Customer</dt>
                    <dd className="text-sm text-ink-800">
                      {project.organization?.name ?? project.owner.name}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {project.instructions ? (
                <p className="mt-4 whitespace-pre-wrap text-sm text-ink-700">
                  {project.instructions}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <FileManager
            projectId={project.id}
            uploadKinds={uploadKinds}
            canMarkCustomerVisible={manages}
            files={project.files.map((file) => ({
              id: file.id,
              filename: file.filename,
              kind: file.kind,
              version: file.version,
              sizeBytes: file.sizeBytes,
              customerVisible: file.customerVisible,
              createdAt: file.createdAt.toISOString(),
            }))}
          />

          <MessageThread
            projectId={project.id}
            canPostInternal={staff}
            messages={messages.map((message) => ({
              id: message.id,
              body: message.body,
              visibility: message.visibility,
              createdAt: message.createdAt.toISOString(),
              author: message.author ? { name: message.author.name } : null,
            }))}
          />

          {(reviewsQa || manages || project.qaReviews.length) && staff ? (
            <QaPanel
              projectId={project.id}
              canReview={reviewsQa}
              canStart={reviewsQa || manages}
              reviews={project.qaReviews.map((review) => ({
                id: review.id,
                outcome: review.outcome,
                comments: review.comments,
                submittedAt: review.submittedAt?.toISOString() ?? null,
                createdAt: review.createdAt.toISOString(),
                reviewer: { name: review.reviewer.name },
                items: review.items.map((item) => ({
                  id: item.id,
                  section: item.section,
                  label: item.label,
                  checked: item.checked,
                })),
              }))}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Quotes" />
            <CardBody className="space-y-3">
              {project.quotes.length ? (
                project.quotes.map((quote) => (
                  <div key={quote.id} className="rounded-lg border border-ink-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink-900">{quote.reference}</span>
                      <Badge tone={quote.status === QuoteStatus.ACCEPTED ? "success" : "neutral"}>
                        {quote.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-700">
                      {formatMoney(quote.totalMinor, quote.currency)}
                    </p>
                    <p className="text-xs text-ink-400">
                      Valid until {formatDate(quote.validUntil)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {manages && quote.status === QuoteStatus.DRAFT ? (
                        <ActionButton endpoint={`/api/quotes/${quote.id}/send`}>
                          Send to customer
                        </ActionButton>
                      ) : null}
                      {!staff && quote.status === QuoteStatus.SENT ? (
                        <>
                          <ActionButton
                            endpoint={`/api/quotes/${quote.id}/respond`}
                            body={{ decision: "ACCEPT" }}
                          >
                            Accept quote
                          </ActionButton>
                          <ActionButton
                            endpoint={`/api/quotes/${quote.id}/respond`}
                            body={{ decision: "DECLINE" }}
                            variant="outline"
                            confirm="Decline this quote?"
                          >
                            Decline
                          </ActionButton>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-500">No quote has been prepared yet.</p>
              )}
              {manages && (!latestQuote || latestQuote.status === QuoteStatus.DECLINED) ? (
                <ActionButton
                  endpoint={`/api/projects/${project.id}/quotes`}
                  body={{ fromPricing: true }}
                  variant="outline"
                >
                  Draft quote from pricing
                </ActionButton>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Invoices" />
            <CardBody className="space-y-3">
              {project.invoices.length ? (
                project.invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-lg border border-ink-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink-900">{invoice.number}</span>
                      <Badge tone={invoice.status === "PAID" ? "success" : "warning"}>
                        {invoice.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-700">
                      {formatMoney(invoice.totalMinor, invoice.currency)}
                    </p>
                    {invoice.dueAt ? (
                      <p className="text-xs text-ink-400">Due {formatDate(invoice.dueAt)}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {invoice.status !== "PAID" && !staff ? (
                        <ActionButton
                          endpoint={`/api/invoices/${invoice.id}/pay`}
                          body={{ provider: "manual" }}
                        >
                          Pay now
                        </ActionButton>
                      ) : null}
                      {hasRole(actor, "FINANCE", "SUPER_ADMIN")
                        ? invoice.payments
                            .filter((payment) => payment.status === "PENDING")
                            .map((payment) => (
                              <ActionButton
                                key={payment.id}
                                endpoint={`/api/payments/${payment.id}/confirm`}
                                variant="outline"
                              >
                                Confirm payment
                              </ActionButton>
                            ))
                        : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-500">No invoice has been issued yet.</p>
              )}
            </CardBody>
          </Card>

          {manages ? (
            <AssignmentPanel
              projectId={project.id}
              staff={staffOptions}
              assignments={project.assignments.map((assignment) => ({
                id: assignment.id,
                role: assignment.role,
                user: { id: assignment.user.id, name: assignment.user.name },
              }))}
            />
          ) : null}

          {(manages || isEditor) && nextStatuses.length ? (
            <Card>
              <CardHeader title="Move this project" />
              <CardBody className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  <ActionButton
                    key={status}
                    endpoint={`/api/projects/${project.id}/transition`}
                    body={{ status }}
                    variant={status === ProjectStatus.CANCELLED ? "outline" : "primary"}
                    confirm={
                      status === ProjectStatus.CANCELLED ? "Cancel this project?" : undefined
                    }
                  >
                    {STATUS_LABELS[status]}
                  </ActionButton>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="History" />
            <CardBody>
              <ul className="space-y-3">
                {project.events.slice(0, 15).map((event) => (
                  <li key={event.id} className="text-sm">
                    <p className="text-ink-800">{event.summary}</p>
                    <p className="text-xs text-ink-400">
                      {event.actor?.name ?? "System"} · {formatDateTime(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
