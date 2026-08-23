import Link from "next/link";
import { ProjectStatus } from "@prisma/client";
import { Card, CardBody, CardHeader, EmptyState, Stat } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireActor } from "@/server/auth/session";
import { hasRole, isStaff } from "@/server/policies";
import { listProjects } from "@/server/services/projects";
import { listQuoteRequests } from "@/server/services/quote-requests";
import { OPEN_STATUSES } from "@/server/services/workflow";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const actor = await requireActor();
  const projects = await listProjects(actor, { status: OPEN_STATUSES });
  const staff = isStaff(actor);
  const pendingRequests = hasRole(actor, "PROJECT_MANAGER", "FINANCE", "SUPER_ADMIN")
    ? await listQuoteRequests(actor, "NEW")
    : [];

  const awaitingYou = projects.filter((project) =>
    staff
      ? project.status === ProjectStatus.AWAITING_ASSIGNMENT ||
        project.status === ProjectStatus.EDITOR_SUBMITTED
      : project.status === ProjectStatus.AWAITING_CUSTOMER_APPROVAL ||
        project.status === ProjectStatus.AWAITING_PAYMENT,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Welcome back, {actor.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {staff
              ? "Work queues and projects currently moving through the workflow."
              : "Track your documents from quotation through to delivery."}
          </p>
        </div>
        {!staff ? <ButtonLink href="/quote">Request a quote</ButtonLink> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open projects" value={projects.length} />
        <Stat label={staff ? "Needs action" : "Waiting on you"} value={awaitingYou.length} />
        {staff ? <Stat label="New quote requests" value={pendingRequests.length} /> : null}
        <Stat
          label="Next deadline"
          value={projects[0] ? formatDate(projects[0].deadline) : "—"}
          hint={projects[0]?.title}
        />
      </div>

      <Card>
        <CardHeader
          title="Active projects"
          action={
            <Link
              href="/dashboard/projects"
              className="text-sm font-medium text-accent-700 hover:text-accent-800"
            >
              View all
            </Link>
          }
        />
        <CardBody className="p-0">
          {projects.length ? (
            <ul className="divide-y divide-ink-50">
              {projects.slice(0, 8).map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-900">{project.title}</p>
                      <p className="text-xs text-ink-500">
                        {project.reference} · {project.service.name} · due{" "}
                        {formatDate(project.deadline)}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState
                title="No active projects"
                description={
                  staff
                    ? "New work will appear here once quote requests are converted."
                    : "Send us a document and we will quote it."
                }
                action={!staff ? <ButtonLink href="/quote">Request a quote</ButtonLink> : undefined}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
