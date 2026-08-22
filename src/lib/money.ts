/// Money is stored as integer minor units to avoid floating point drift.
/// UGX has no commonly used minor unit in practice, but the platform is
/// multi-currency by design so everything is normalised to 1/100.
export const MINOR_UNITS_PER_MAJOR = 100;

export function toMinor(major: number): number {
  return Math.round(major * MINOR_UNITS_PER_MAJOR);
}

export function toMajor(minor: number): number {
  return minor / MINOR_UNITS_PER_MAJOR;
}

const zeroDecimalDisplay = new Set(["UGX", "RWF", "TZS"]);

export function formatMoney(minor: number, currency = "UGX", locale = "en-UG"): string {
  const fractionDigits = zeroDecimalDisplay.has(currency) ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(toMajor(minor));
  } catch {
    return `${currency} ${toMajor(minor).toFixed(fractionDigits)}`;
  }
}
