import { env } from "@/lib/env";

export type OutboundEmail = {
  to: string;
  subject: string;
  body: string;
};

export interface MailProvider {
  readonly name: string;
  send(message: OutboundEmail): Promise<void>;
}

/// Default driver: nothing leaves the machine. Messages are persisted in the
/// OutboundMessage outbox by the notification service and logged here.
class LogMailProvider implements MailProvider {
  readonly name = "log";
  async send(message: OutboundEmail): Promise<void> {
    console.info(`[mail:log] to=${message.to} subject="${message.subject}"`);
  }
}

class SmtpMailProvider implements MailProvider {
  readonly name = "smtp";
  async send(message: OutboundEmail): Promise<void> {
    const config = env();
    if (!config.SMTP_HOST) {
      throw new Error("MAIL_DRIVER=smtp requires SMTP_HOST to be configured");
    }
    // nodemailer is an optional dependency; it is only loaded when SMTP is on.
    const { createTransport } = await import("nodemailer");
    const transport = createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT ?? 587,
      secure: (config.SMTP_PORT ?? 587) === 465,
      auth: config.SMTP_USER
        ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD }
        : undefined,
    });
    await transport.sendMail({
      from: config.MAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.body,
    });
  }
}

let provider: MailProvider | undefined;

export function mailer(): MailProvider {
  if (!provider) {
    provider = env().MAIL_DRIVER === "smtp" ? new SmtpMailProvider() : new LogMailProvider();
  }
  return provider;
}
