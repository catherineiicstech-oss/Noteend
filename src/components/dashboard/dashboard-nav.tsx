"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SystemRole } from "@prisma/client";
import {
  BarChart3,
  Bell,
  Building2,
  FileText,
  Inbox,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: SystemRole[];
  requiresOrganization?: boolean;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FileText },
  {
    href: "/dashboard/quote-requests",
    label: "Quote requests",
    icon: Inbox,
    roles: ["PROJECT_MANAGER", "FINANCE", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/qa",
    label: "QA queue",
    icon: ShieldCheck,
    roles: ["QA_REVIEWER", "PROJECT_MANAGER", "SUPER_ADMIN"],
  },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/organization", label: "Organisation", icon: Building2 },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  {
    href: "/dashboard/admin",
    label: "Analytics",
    icon: BarChart3,
    roles: ["PROJECT_MANAGER", "FINANCE", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/admin/settings",
    label: "Settings",
    icon: Settings,
    roles: ["SUPER_ADMIN"],
  },
];

export function DashboardNav({
  roles,
  hasOrganization,
}: {
  roles: SystemRole[];
  hasOrganization: boolean;
}) {
  const pathname = usePathname();
  const visible = items.filter((item) => {
    if (item.roles && !item.roles.some((role) => roles.includes(role))) return false;
    if (item.requiresOrganization && !hasOrganization) return false;
    return true;
  });

  return (
    <nav aria-label="Dashboard" className="lg:w-56 lg:shrink-0">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {visible.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white text-ink-950 shadow-card"
                    : "text-ink-600 hover:bg-white hover:text-ink-900",
                )}
              >
                <Icon size={16} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
