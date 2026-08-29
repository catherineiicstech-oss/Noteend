"use client";

import { useState } from "react";
import { Alert, Badge, Card, CardBody, CardHeader, Select } from "@/components/ui";
import { Button } from "@/components/ui/button";

export type StaffOption = { id: string; name: string; roles: string[] };

export type CurrentAssignment = {
  id: string;
  role: string;
  user: { id: string; name: string };
};

const assignableRoles = [
  { value: "PROJECT_MANAGER", label: "Project manager" },
  { value: "EDITOR", label: "Editor" },
  { value: "QA_REVIEWER", label: "QA reviewer" },
];

export function AssignmentPanel({
  projectId,
  staff,
  assignments,
}: {
  projectId: string;
  staff: StaffOption[];
  assignments: CurrentAssignment[];
}) {
  const [role, setRole] = useState("EDITOR");
  const [userId, setUserId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidates = staff.filter((member) => member.roles.includes(role));

  async function call(init: RequestInit) {
    setPending(true);
    setError(null);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    setPending(false);
    setError(`Demo team action saved locally for ${projectId}.`);
    void init;
  }

  return (
    <Card>
      <CardHeader title="Team" description="Editors only see the projects they are assigned to." />
      <CardBody className="space-y-4">
        {error ? <Alert tone="success">{error}</Alert> : null}

        {assignments.length ? (
          <ul className="space-y-2">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <Badge>{assignment.role.replace("_", " ").toLowerCase()}</Badge>
                  <span className="text-ink-800">{assignment.user.name}</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    void call({
                      method: "DELETE",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ assignmentId: assignment.id }),
                    })
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-500">Nobody is assigned yet.</p>
        )}

        <div className="flex flex-wrap items-end gap-3 border-t border-ink-100 pt-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-800">Role</span>
            <Select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setUserId("");
              }}
            >
              {assignableRoles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-800">Team member</span>
            <Select value={userId} onChange={(event) => setUserId(event.target.value)}>
              <option value="">Select…</option>
              {candidates.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </label>
          <Button
            size="sm"
            disabled={pending || !userId}
            onClick={() =>
              void call({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ userId, role }),
              })
            }
          >
            Assign
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
