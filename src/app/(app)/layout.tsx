import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { currentActor } from "@/server/auth/session";
import { unreadCount } from "@/server/services/notifications";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const actor = await currentActor();
  if (!actor) redirect("/login?next=/dashboard");
  const unread = await unreadCount(actor.id);

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-display text-lg font-semibold text-ink-950">
            {siteConfig.name}
          </Link>
          <UserMenu name={actor.name} email={actor.email} roles={actor.roles} unread={unread} />
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <DashboardNav roles={actor.roles} hasOrganization={actor.memberships.length > 0} />
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
