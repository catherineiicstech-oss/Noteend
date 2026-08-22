import { prisma } from "@/server/db";
import type { Actor } from "@/server/auth/session";
import { assertPermission, hasRole } from "@/server/policies";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(count: number): string[] {
  const keys: string[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  for (let index = count - 1; index >= 0; index--) {
    const date = new Date(cursor);
    date.setMonth(cursor.getMonth() - index);
    keys.push(monthKey(date));
  }
  return keys;
}

export async function adminOverview(actor: Actor) {
  assertPermission(
    hasRole(actor, "SUPER_ADMIN", "FINANCE", "PROJECT_MANAGER"),
    "Only staff can view analytics",
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [projects, invoices, users, organizations, quoteRequests, reviews] =
    await Promise.all([
      prisma.project.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
          deadline: true,
          deliveredAt: true,
          industry: true,
          ownerUserId: true,
          service: { select: { name: true } },
          assignments: {
            where: { unassignedAt: null, role: "EDITOR" },
            select: { userId: true, user: { select: { name: true } } },
          },
        },
      }),
      prisma.invoice.findMany({
        select: {
          status: true,
          totalMinor: true,
          amountPaidMinor: true,
          currency: true,
          paidAt: true,
          issuedAt: true,
        },
      }),
      prisma.user.findMany({ select: { createdAt: true } }),
      prisma.organization.count(),
      prisma.quoteRequest.findMany({ select: { status: true, createdAt: true } }),
      prisma.review.findMany({ select: { rating: true } }),
    ]);

  const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID");
  const revenueByMonth = lastMonths(12).map((key) => ({
    month: key,
    revenueMinor: paidInvoices
      .filter((invoice) => invoice.paidAt && monthKey(invoice.paidAt) === key)
      .reduce((sum, invoice) => sum + invoice.amountPaidMinor, 0),
  }));

  const customerGrowth = lastMonths(12).map((key) => ({
    month: key,
    customers: users.filter((user) => monthKey(user.createdAt) === key).length,
  }));

  const byService = Object.entries(
    projects.reduce<Record<string, number>>((acc, project) => {
      acc[project.service.name] = (acc[project.service.name] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, count]) => ({ name, count }));

  const byIndustry = Object.entries(
    projects.reduce<Record<string, number>>((acc, project) => {
      const key = project.industry || "Unspecified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, count]) => ({ name, count }));

  const turnaround = projects
    .filter((project) => project.deliveredAt)
    .map(
      (project) => (project.deliveredAt!.getTime() - project.createdAt.getTime()) / 3_600_000,
    );

  const editorStats = new Map<string, { name: string; active: number; delivered: number }>();
  for (const project of projects) {
    for (const assignment of project.assignments) {
      const entry = editorStats.get(assignment.userId) ?? {
        name: assignment.user.name,
        active: 0,
        delivered: 0,
      };
      if (["DELIVERED", "CLOSED", "COMPLETED"].includes(project.status)) entry.delivered += 1;
      else entry.active += 1;
      editorStats.set(assignment.userId, entry);
    }
  }

  const projectsPerCustomer = projects.reduce<Record<string, number>>((acc, project) => {
    acc[project.ownerUserId] = (acc[project.ownerUserId] ?? 0) + 1;
    return acc;
  }, {});
  const repeatCustomers = Object.values(projectsPerCustomer).filter((count) => count > 1).length;

  const quoted = quoteRequests.filter((request) =>
    ["QUOTED", "CONVERTED"].includes(request.status),
  ).length;

  return {
    totalRevenueMinor: paidInvoices.reduce((sum, invoice) => sum + invoice.amountPaidMinor, 0),
    monthRevenueMinor: paidInvoices
      .filter((invoice) => invoice.paidAt && invoice.paidAt >= monthStart)
      .reduce((sum, invoice) => sum + invoice.amountPaidMinor, 0),
    currency: invoices[0]?.currency ?? "UGX",
    activeProjects: projects.filter(
      (project) => !["DELIVERED", "CLOSED", "CANCELLED"].includes(project.status),
    ).length,
    newCustomersThisMonth: users.filter((user) => user.createdAt >= monthStart).length,
    organizations,
    pendingQuoteRequests: quoteRequests.filter((request) => request.status === "NEW").length,
    pendingPaymentsMinor: invoices
      .filter((invoice) => invoice.status === "ISSUED")
      .reduce((sum, invoice) => sum + invoice.totalMinor - invoice.amountPaidMinor, 0),
    awaitingAssignment: projects.filter((project) => project.status === "AWAITING_ASSIGNMENT")
      .length,
    inQa: projects.filter((project) => ["QA_REVIEW", "FINAL_REVIEW"].includes(project.status))
      .length,
    overdue: projects.filter(
      (project) =>
        project.deadline < now &&
        !["DELIVERED", "CLOSED", "CANCELLED", "COMPLETED"].includes(project.status),
    ).length,
    averageTurnaroundHours: turnaround.length
      ? Math.round(turnaround.reduce((a, b) => a + b, 0) / turnaround.length)
      : null,
    satisfaction: reviews.length
      ? Number(
          (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2),
        )
      : null,
    quoteConversionPercent: quoteRequests.length
      ? Math.round((quoted / quoteRequests.length) * 100)
      : 0,
    repeatCustomers,
    revenueByMonth,
    customerGrowth,
    byService,
    byIndustry,
    editorPerformance: [...editorStats.values()].sort((a, b) => b.delivered - a.delivered),
  };
}
