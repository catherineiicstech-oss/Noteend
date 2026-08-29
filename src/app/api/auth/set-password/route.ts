import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { completePasswordSetup } from "@/server/services/account-access";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(10, "Use at least 10 characters").max(200),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    await completePasswordSetup(input.email.trim().toLowerCase(), input.token, input.password);
    return ok({ updated: true });
  } catch (error) {
    return errorResponse(error);
  }
}
