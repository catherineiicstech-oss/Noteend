import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { queueEmail } from "@/server/services/notifications";
import { siteConfig } from "@/lib/site";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  organization: z.string().max(160).optional().or(z.literal("")),
  topic: z.string().min(2).max(80),
  message: z.string().min(10).max(4000),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());

    await queueEmail(
      siteConfig.contactEmail,
      `Website enquiry: ${input.topic}`,
      [
        `From: ${input.name} <${input.email}>`,
        input.phone ? `Phone: ${input.phone}` : null,
        input.organization ? `Organisation: ${input.organization}` : null,
        "",
        input.message,
      ]
        .filter(Boolean)
        .join("\n"),
    );

    await queueEmail(
      input.email,
      `We received your message — ${siteConfig.name}`,
      `Hello ${input.name},\n\nThank you for contacting us. A member of our team will reply shortly.\n\n${siteConfig.name}`,
    );

    return ok({ received: true });
  } catch (error) {
    return errorResponse(error);
  }
}
