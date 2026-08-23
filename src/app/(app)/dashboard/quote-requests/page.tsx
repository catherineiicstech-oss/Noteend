import { Badge, Card, CardBody, EmptyState, Table, Td, Th } from "@/components/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { requireRole } from "@/server/auth/session";
import { listQuoteRequests } from "@/server/services/quote-requests";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QuoteRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const actor = await requireRole("PROJECT_MANAGER", "FINANCE", "SUPER_ADMIN");
  const requests = await listQuoteRequests(actor, status);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Quote requests</h1>
        <p className="mt-1 text-sm text-ink-500">
          Leads from the public site. Converting one creates the project and copies the uploaded
          files across.
        </p>
      </div>

      <Card>
        <CardBody className="p-0">
          {requests.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Contact</Th>
                  <Th>Service</Th>
                  <Th>Deadline</Th>
                  <Th>Estimate</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <Td>
                      <span className="font-medium text-ink-900">{request.reference}</span>
                      <span className="block text-xs text-ink-400">
                        {request.files.length} file{request.files.length === 1 ? "" : "s"}
                      </span>
                    </Td>
                    <Td>
                      {request.contactName}
                      <span className="block text-xs text-ink-400">{request.contactEmail}</span>
                    </Td>
                    <Td>{request.service?.name ?? request.serviceOther ?? "—"}</Td>
                    <Td>{formatDate(request.deadline)}</Td>
                    <Td>
                      {request.estimateMinor
                        ? formatMoney(request.estimateMinor, request.estimateCurrency ?? "UGX")
                        : "—"}
                    </Td>
                    <Td>
                      <Badge tone={request.status === "CONVERTED" ? "success" : "info"}>
                        {request.status.toLowerCase()}
                      </Badge>
                    </Td>
                    <Td>
                      {request.status !== "CONVERTED" && request.serviceId ? (
                        <ActionButton endpoint={`/api/quote-requests/${request.id}/convert`}>
                          Convert to project
                        </ActionButton>
                      ) : null}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="p-5">
              <EmptyState title="No quote requests yet" />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
