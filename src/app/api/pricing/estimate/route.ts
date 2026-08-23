import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { estimateForService } from "@/server/services/pricing";

const schema = z.object({
  serviceId: z.string().min(1),
  wordCount: z.coerce.number().int().min(1).max(2_000_000),
  complexity: z.enum(["STANDARD", "TECHNICAL", "SPECIALIST"]),
  deadline: z.coerce.date(),
  fileCount: z.coerce.number().int().min(0).max(50).default(1),
  needsFormatting: z.boolean().default(false),
  needsResearch: z.boolean().default(false),
});

/// Public endpoint: returns an indicative estimate only. Binding prices are
/// always issued by staff through the quotation flow.
export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const breakdown = await estimateForService(input.serviceId, {
      wordCount: input.wordCount,
      complexity: input.complexity,
      deadline: input.deadline,
      fileCount: Math.max(1, input.fileCount),
      needsFormatting: input.needsFormatting,
      needsResearch: input.needsResearch,
    });
    return ok({ estimate: breakdown, indicative: true });
  } catch (error) {
    return errorResponse(error);
  }
}
