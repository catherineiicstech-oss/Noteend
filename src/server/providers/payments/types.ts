import type { PaymentStatus } from "@prisma/client";

export type PaymentIntentInput = {
  invoiceId: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  reference: string;
  method?: string;
};

export type PaymentIntentResult = {
  provider: string;
  providerRef: string;
  status: PaymentStatus;
  /// Where to send the payer next, when the provider needs a redirect.
  redirectUrl?: string;
  /// Human-readable instructions, e.g. bank details for manual transfer.
  instructions?: string;
};

export type ProviderWebhookResult = {
  providerRef: string;
  status: PaymentStatus;
  failureReason?: string;
};

export interface PaymentProvider {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  /// Whether a human must confirm receipt before the payment is marked successful.
  readonly requiresManualConfirmation: boolean;
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  parseWebhook(payload: unknown, signature?: string): Promise<ProviderWebhookResult>;
}
