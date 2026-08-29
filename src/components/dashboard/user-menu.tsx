"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import type { SystemRole } from "@prisma/client";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";

const roleLabels: Record<SystemRole, string> = {
  CUSTOMER: "Customer",
  PROJECT_MANAGER: "Project manager",
  EDITOR: "Editor",
  QA_REVIEWER: "QA reviewer",
  FINANCE: "Finance",
  SUPER_ADMIN: "Administrator",
};

export function UserMenu({
  name,
  email,
  roles,
  unread,
}: {
  name: string;
  email: string;
  roles: SystemRole[];
  unread: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard/notifications"
        className="relative rounded-md p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-800"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell size={18} aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-ink-900">{name}</p>
        <p className="text-xs text-ink-500">{email}</p>
      </div>
      <div className="hidden md:flex md:gap-1">
        {roles.map((role) => (
          <Badge key={role} tone={role === "SUPER_ADMIN" ? "success" : "neutral"}>
            {roleLabels[role]}
          </Badge>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </Button>
    </div>
  );
}
