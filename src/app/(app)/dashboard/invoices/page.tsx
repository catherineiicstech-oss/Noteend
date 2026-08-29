import Link from "next/link";
import { Badge, Card, CardBody, EmptyState, Table, Td, Th } from "@/components/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { demoInvoices } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const finance = true;
  const invoices = demoInvoices;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Invoices</h1>

      <Card>
        <CardBody className="p-0">
          {invoices.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Project</Th>
                  <Th>Amount</Th>
                  <Th>Due</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <Td>{invoice.number}</Td>
                    <Td>
                      {invoice.project ? (
                        <Link
                          href={`/dashboard/projects/${invoice.project.id}`}
                          className="text-ink-900 hover:text-accent-700"
                        >
                          {invoice.project.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>{formatMoney(invoice.totalMinor, invoice.currency)}</Td>
                    <Td>{invoice.dueAt ? formatDate(invoice.dueAt) : "—"}</Td>
                    <Td>
                      <Badge tone={invoice.status === "PAID" ? "success" : "warning"}>
                        {invoice.status.toLowerCase()}
                      </Badge>
                    </Td>
                    <Td>
                      {invoice.status !== "PAID" && !finance ? (
                        <ActionButton
                          endpoint={`/api/invoices/${invoice.id}/pay`}
                          body={{ provider: "manual" }}
                        >
                          Pay now
                        </ActionButton>
                      ) : null}
                      {finance
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
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="p-5">
              <EmptyState title="No invoices yet" />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
