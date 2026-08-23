import { Card, CardBody, CardHeader, Stat, Table, Td, Th } from "@/components/ui";
import { requireRole } from "@/server/auth/session";
import { adminOverview } from "@/server/services/analytics";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const actor = await requireRole("PROJECT_MANAGER", "FINANCE", "SUPER_ADMIN");
  const overview = await adminOverview(actor);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Analytics</h1>
        <p className="mt-1 text-sm text-ink-500">
          Figures are calculated from live project, invoice and payment records.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Revenue (all time)"
          value={formatMoney(overview.totalRevenueMinor, overview.currency)}
        />
        <Stat
          label="Revenue this month"
          value={formatMoney(overview.monthRevenueMinor, overview.currency)}
        />
        <Stat label="Active projects" value={overview.activeProjects} />
        <Stat label="Pending quote requests" value={overview.pendingQuoteRequests} />
        <Stat label="Awaiting assignment" value={overview.awaitingAssignment} />
        <Stat label="In QA" value={overview.inQa} />
        <Stat label="Overdue" value={overview.overdue} />
        <Stat
          label="Quote conversion"
          value={`${overview.quoteConversionPercent}%`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue by month" />
          <CardBody className="p-0">
            <Table className="min-w-0">
              <thead>
                <tr>
                  <Th>Month</Th>
                  <Th>Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {overview.revenueByMonth.map((row) => (
                  <tr key={row.month}>
                    <Td>{row.month}</Td>
                    <Td>{formatMoney(row.revenueMinor, overview.currency)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Projects by service" />
          <CardBody className="p-0">
            <Table className="min-w-0">
              <thead>
                <tr>
                  <Th>Service</Th>
                  <Th>Projects</Th>
                </tr>
              </thead>
              <tbody>
                {overview.byService.map((row) => (
                  <tr key={row.name}>
                    <Td>{row.name}</Td>
                    <Td>{row.count}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Editor performance" />
          <CardBody className="p-0">
            <Table className="min-w-0">
              <thead>
                <tr>
                  <Th>Editor</Th>
                  <Th>Active</Th>
                  <Th>Delivered</Th>
                </tr>
              </thead>
              <tbody>
                {overview.editorPerformance.map((row) => (
                  <tr key={row.name}>
                    <Td>{row.name}</Td>
                    <Td>{row.active}</Td>
                    <Td>{row.delivered}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Customers" />
          <CardBody>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">New this month</dt>
                <dd className="text-ink-900">{overview.newCustomersThisMonth}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Organisations</dt>
                <dd className="text-ink-900">{overview.organizations}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Repeat customers</dt>
                <dd className="text-ink-900">{overview.repeatCustomers}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Average turnaround</dt>
                <dd className="text-ink-900">
                  {overview.averageTurnaroundHours
                    ? `${overview.averageTurnaroundHours.toFixed(0)} hours`
                    : "—"}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
