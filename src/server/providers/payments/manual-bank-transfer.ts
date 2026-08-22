import { nanoid } from "nanoid";
import { getSetting } from "@/server/services/settings";
import type {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  ProviderWebhookResult,
} from "./types";

/// Bank transfer / cash. Finance confirms receipt in the admin dashboard.
export class ManualBankTransferProvider implements PaymentProvider {
  readonly key = "manual_bank_transfer";
  readonly label = "Bank transfer";
  readonly description =
    "Pay by bank transfer or deposit. Your project starts once our finance team confirms receipt.";
  readonly requiresManualConfirmation = true;

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const details = await getSetting("billing.bankDetails", {
      accountName: "Not configured",
      bank: "Not configured",
      accountNumber: "Not configured",
      branch: "Not configured",
    });
    return {
      provider: this.key,
      providerRef: `MBT-${nanoid(12)}`,
      status: "PENDING",
      instructions: [
        `Account name: ${details.accountName}`,
        `Bank: ${details.bank}`,
        `Account number: ${details.accountNumber}`,
        `Branch: ${details.branch}`,
        `Payment reference: ${input.reference}`,
      ].join("\n"),
    };
  }

  async parseWebhook(): Promise<ProviderWebhookResult> {
    throw new Error("Manual bank transfer does not receive webhooks");
  }
}
