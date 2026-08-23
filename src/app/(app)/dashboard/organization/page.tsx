import { Card, CardBody, CardHeader, EmptyState, Stat } from "@/components/ui";
import { OrganizationPanel } from "@/components/dashboard/organization-panel";
import { CreateOrganizationForm } from "@/components/dashboard/create-organization-form";
import { requireActor } from "@/server/auth/session";
import { getOrganization, organizationUsage } from "@/server/services/organizations";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  const actor = await requireActor();
  const membership = actor.memberships[0];

  if (!membership) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl">Organisation</h1>
        <Card>
          <CardHeader
            title="Create an organisation"
            description="Organisations let colleagues share projects, invoices and a single billing account."
          />
          <CardBody>
            <CreateOrganizationForm />
          </CardBody>
        </Card>
      </div>
    );
  }

  const organization = await getOrganization(actor, membership.organizationId);
  const usage = await organizationUsage(actor, membership.organizationId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">{organization.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          You are {membership.role.toLowerCase()} of this organisation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Members" value={organization.members.length} />
        <Stat label="Active projects" value={usage.activeProjects} />
        <Stat label="Spend to date" value={formatMoney(usage.spendMinor, usage.currency)} />
      </div>

      <OrganizationPanel
        organizationId={organization.id}
        canManage={membership.role !== "MEMBER"}
        members={organization.members.map((member) => ({
          id: member.id,
          role: member.role,
          user: { name: member.user.name, email: member.user.email },
        }))}
        invitations={organization.invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
        }))}
      />

      {organization.members.length === 0 ? <EmptyState title="No members yet" /> : null}
    </div>
  );
}
