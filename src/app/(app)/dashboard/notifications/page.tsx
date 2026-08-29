import Link from "next/link";
import { Card, CardBody, EmptyState } from "@/components/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { requireActor } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const actor = await requireActor();
  const notifications = await prisma.notification.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Notifications</h1>
      <Card>
        <CardBody className="p-0">
          {notifications.length ? (
            <ul className="divide-y divide-ink-50">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${
                    notification.readAt ? "" : "bg-accent-50/40"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">{notification.title}</p>
                    <p className="text-sm text-ink-600">{notification.body}</p>
                    <p className="text-xs text-ink-400">{formatDateTime(notification.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        className="text-sm font-medium text-accent-700 hover:text-accent-800"
                      >
                        Open
                      </Link>
                    ) : null}
                    {!notification.readAt ? (
                      <ActionButton
                        endpoint={`/api/notifications/${notification.id}/read`}
                        variant="ghost"
                      >
                        Mark read
                      </ActionButton>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState title="No notifications" />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
