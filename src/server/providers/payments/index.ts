import { enabledPaymentProviders } from "@/lib/env";
import { ValidationError } from "@/lib/errors";
import { ManualBankTransferProvider } from "./manual-bank-transfer";
import { MobileMoneyStubProvider } from "./mobile-money-stub";
import type { PaymentProvider } from "./types";

const registry: Record<string, () => PaymentProvider> = {
  manual_bank_transfer: () => new ManualBankTransferProvider(),
  mobile_money_stub: () => new MobileMoneyStubProvider(),
};

export function availablePaymentProviders(): PaymentProvider[] {
  return enabledPaymentProviders()
    .filter((key) => key in registry)
    .map((key) => registry[key]());
}

export function paymentProvider(key: string): PaymentProvider {
  if (!enabledPaymentProviders().includes(key) || !(key in registry)) {
    throw new ValidationError(`Payment provider "${key}" is not enabled`);
  }
  return registry[key]();
}

export type { PaymentProvider } from "./types";
