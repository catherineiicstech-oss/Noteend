import { EmptyState, Stat } from "@/components/ui";
import { OrganizationPanel } from "@/components/dashboard/organization-panel";
import { formatMoney } from "@/lib/money";
import { demoActor, demoOrganization, demoOrganizationUsage } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  const membership = demoActor.memberships[0];
  const organization = demoOrganization;
  const usage = demoOrganizationUsage;

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
          acceptedAt: invitation.acceptedAt,
        }))}
      />

      {organization.members.length === 0 ? <EmptyState title="No members yet" /> : null}
    </div>
  );
}
