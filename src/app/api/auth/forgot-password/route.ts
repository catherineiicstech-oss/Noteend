import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { issuePasswordSetupToken } from "@/server/services/account-access";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    await issuePasswordSetupToken(email.trim().toLowerCase(), "RESET");
    // Always the same answer, so the endpoint cannot be used to discover
    // which email addresses have accounts.
    return ok({ sent: true });
  } catch (error) {
    return errorResponse(error);
  }
}
