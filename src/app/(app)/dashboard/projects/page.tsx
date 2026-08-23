import Link from "next/link";
import { ProjectStatus } from "@prisma/client";
import { Card, CardBody, EmptyState, Table, Td, Th } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireActor } from "@/server/auth/session";
import { isStaff } from "@/server/policies";
import { listProjects } from "@/server/services/projects";
import { STATUS_LABELS } from "@/server/services/workflow";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const actor = await requireActor();
  const selected =
    status && status in ProjectStatus ? [status as ProjectStatus] : undefined;
  const projects = await listProjects(actor, { status: selected, search: q });
  const staff = isStaff(actor);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl">Projects</h1>
        {!staff ? <ButtonLink href="/quote">Request a quote</ButtonLink> : null}
      </div>

      <form className="flex flex-wrap gap-2" action="/dashboard/projects">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search title or reference"
          className="w-full max-w-xs rounded-md border border-ink-200 px-3 py-2 text-sm sm:w-auto"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-ink-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Object.values(ProjectStatus).map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-white"
        >
          Filter
        </button>
      </form>

      <Card>
        <CardBody className="p-0">
          {projects.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Project</Th>
                  <Th>Service</Th>
                  {staff ? <Th>Customer</Th> : null}
                  <Th>Deadline</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <Td>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="font-medium text-ink-900 hover:text-accent-700"
                      >
                        {project.title}
                      </Link>
                      <span className="block text-xs text-ink-400">{project.reference}</span>
                    </Td>
                    <Td>{project.service.name}</Td>
                    {staff ? (
                      <Td>
                        {project.organization?.name ?? project.owner.name}
                      </Td>
                    ) : null}
                    <Td>{formatDate(project.deadline)}</Td>
                    <Td>
                      <StatusBadge status={project.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="p-5">
              <EmptyState
                title="No projects match this view"
                description="Adjust the filters, or submit a new request."
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
