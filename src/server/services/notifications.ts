import { prisma } from "@/server/db";
import { mailer } from "@/server/providers/mail";
import { getSetting } from "@/server/services/settings";

export type NotificationInput = {
  type: string;
  title: string;
  body: string;
  link?: string;
  /// Also queue an email. In-app only when false.
  email?: boolean;
};

/// Writes an in-app notification and queues an email through the outbox. The
/// outbox keeps transport swappable (SMS/WhatsApp can be added as channels).
export async function notify(userId: string, input: NotificationInput): Promise<void> {
  const enabled = await getSetting("notifications.enabled");
  if (!enabled) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) return;

  await prisma.notification.create({
    data: {
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });

  if (input.email !== false) {
    await queueEmail(user.email, input.title, `Hello ${user.name},\n\n${input.body}`);
  }
}

export async function queueEmail(
  recipient: string,
  subject: string,
  body: string,
  channel = "EMAIL",
): Promise<void> {
  await prisma.outboundMessage.create({
    data: { channel, recipient, subject, body, status: "QUEUED" },
  });
}

/// Drains the outbox. Invoked from an admin action or a scheduled job; kept
/// separate from request handling so a mail outage never fails a mutation.
export async function flushOutbox(limit = 50): Promise<{ sent: number; failed: number }> {
  const queued = await prisma.outboundMessage.findMany({
    where: { status: "QUEUED", channel: "EMAIL" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  let failed = 0;
  for (const message of queued) {
    try {
      await mailer().send({
        to: message.recipient,
        subject: message.subject,
        body: message.body,
      });
      await prisma.outboundMessage.update({
        where: { id: message.id },
        data: { status: "SENT", sentAt: new Date(), attempts: message.attempts + 1 },
      });
      sent += 1;
    } catch (error) {
      await prisma.outboundMessage.update({
        where: { id: message.id },
        data: {
          status: message.attempts >= 4 ? "FAILED" : "QUEUED",
          attempts: message.attempts + 1,
          lastError: error instanceof Error ? error.message : String(error),
        },
      });
      failed += 1;
    }
  }
  return { sent, failed };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}
