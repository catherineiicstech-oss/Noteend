import Link from "next/link";
import { ProjectStatus } from "@prisma/client";
import { Card, CardBody, EmptyState, Table, Td, Th } from "@/components/ui";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireRole } from "@/server/auth/session";
import { listProjects } from "@/server/services/projects";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QaQueuePage() {
  const actor = await requireRole("QA_REVIEWER", "PROJECT_MANAGER", "SUPER_ADMIN");
  const projects = await listProjects(actor, {
    status: [ProjectStatus.EDITOR_SUBMITTED, ProjectStatus.QA_REVIEW, ProjectStatus.FINAL_REVIEW],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">QA queue</h1>
        <p className="mt-1 text-sm text-ink-500">
          Work waiting for a second reviewer before it can be completed.
        </p>
      </div>

      <Card>
        <CardBody className="p-0">
          {projects.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Project</Th>
                  <Th>Service</Th>
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
              <EmptyState title="Nothing is waiting for QA" />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
