import { z } from "zod";
import { nanoid } from "nanoid";
import type {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  ProviderWebhookResult,
} from "./types";

const webhookSchema = z.object({
  reference: z.string().min(1),
  status: z.enum(["successful", "failed", "pending", "processing"]),
  reason: z.string().optional(),
});

const statusMap = {
  successful: "SUCCESSFUL",
  failed: "FAILED",
  pending: "PENDING",
  processing: "PROCESSING",
} as const;

/// Placeholder for a Uganda mobile money aggregator (MTN MoMo, Airtel Money).
/// It models the real request/callback shape so wiring a live aggregator means
/// replacing this class only — no changes to the billing service.
export class MobileMoneyStubProvider implements PaymentProvider {
  readonly key = "mobile_money_stub";
  readonly label = "Mobile Money";
  readonly description =
    "Mobile Money (MTN, Airtel). Not yet connected to a live aggregator — awaiting merchant credentials.";
  readonly requiresManualConfirmation = false;

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      provider: this.key,
      providerRef: `MM-${nanoid(12)}`,
      status: "PROCESSING",
      instructions: `A payment prompt would be sent to the payer's phone for ${input.currency} ${(
        input.amountMinor / 100
      ).toLocaleString()}. No live aggregator is configured, so this payment must be confirmed manually.`,
    };
  }

  async parseWebhook(payload: unknown): Promise<ProviderWebhookResult> {
    const parsed = webhookSchema.parse(payload);
    return {
      providerRef: parsed.reference,
      status: statusMap[parsed.status],
      failureReason: parsed.reason,
    };
  }
}
