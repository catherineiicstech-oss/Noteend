"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrgRole } from "@prisma/client";
import { Alert, Badge, Card, CardBody, CardHeader, Input, Select } from "@/components/ui";
import { Button } from "@/components/ui/button";

export type OrgMember = {
  id: string;
  role: OrgRole;
  user: { name: string; email: string };
};

export type OrgInvitation = {
  id: string;
  email: string;
  role: OrgRole;
  acceptedAt: string | null;
};

export function OrganizationPanel({
  organizationId,
  members,
  invitations,
  canManage,
}: {
  organizationId: string;
  members: OrgMember[];
  invitations: OrgInvitation[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("MEMBER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(init: RequestInit) {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/organizations/${organizationId}/members`, init);
    setPending(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "That action could not be completed");
      return;
    }
    setEmail("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Members"
        description="Administrators control who can see the organisation's projects and invoices."
      />
      <CardBody className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <ul className="divide-y divide-ink-50">
          {members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-ink-900">{member.user.name}</p>
                <p className="text-xs text-ink-500">{member.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {canManage ? (
                  <Select
                    value={member.role}
                    disabled={pending}
                    onChange={(event) =>
                      void call({
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ memberId: member.id, role: event.target.value }),
                      })
                    }
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </Select>
                ) : (
                  <Badge>{member.role.toLowerCase()}</Badge>
                )}
                {canManage ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      void call({
                        method: "DELETE",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ memberId: member.id }),
                      })
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {invitations.filter((invitation) => !invitation.acceptedAt).length ? (
          <div className="rounded-lg border border-ink-100 p-3">
            <p className="text-sm font-medium text-ink-800">Pending invitations</p>
            <ul className="mt-2 space-y-1 text-sm text-ink-600">
              {invitations
                .filter((invitation) => !invitation.acceptedAt)
                .map((invitation) => (
                  <li key={invitation.id}>
                    {invitation.email} · {invitation.role.toLowerCase()}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {canManage ? (
          <div className="flex flex-wrap items-end gap-3 border-t border-ink-100 pt-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-800">Invite by email</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="colleague@example.com"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-800">Role</span>
              <Select value={role} onChange={(event) => setRole(event.target.value as OrgRole)}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </label>
            <Button
              size="sm"
              disabled={pending || !email}
              onClick={() =>
                void call({
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ email, role }),
                })
              }
            >
              Send invitation
            </Button>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
