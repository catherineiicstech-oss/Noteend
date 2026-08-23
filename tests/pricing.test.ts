import { describe, expect, it } from "vitest";
import {
  calculatePrice,
  hoursUntil,
  rushMultiplierBps,
  type PricingRuleSnapshot,
} from "@/server/services/pricing";

const rule: PricingRuleSnapshot = {
  currency: "UGX",
  baseRatePerWordMinor: 5_000,
  minimumChargeMinor: 3_000_000,
  extraFilePercent: 10,
  formattingFeeMinor: 500_000,
  researchFeeMinor: 1_000_000,
  complexityMultipliers: [
    { complexity: "STANDARD", multiplierBps: 10_000 },
    { complexity: "TECHNICAL", multiplierBps: 13_000 },
    { complexity: "SPECIALIST", multiplierBps: 16_000 },
  ],
  rushMultipliers: [
    { maxHours: 24, multiplierBps: 15_000 },
    { maxHours: 72, multiplierBps: 12_500 },
  ],
};

const tax = { percent: 18, label: "VAT" };
const now = new Date("2026-01-01T09:00:00Z");
const relaxed = new Date("2026-01-20T09:00:00Z");

function price(overrides: Partial<Parameters<typeof calculatePrice>[1]> = {}) {
  return calculatePrice(
    rule,
    {
      wordCount: 10_000,
      complexity: "STANDARD",
      deadline: relaxed,
      fileCount: 1,
      needsFormatting: false,
      needsResearch: false,
      now,
      ...overrides,
    },
    tax,
  );
}

describe("calculatePrice", () => {
  it("prices words at the configured base rate", () => {
    expect(price().subtotalMinor).toBe(50_000_000);
  });

  it("applies the complexity multiplier", () => {
    expect(price({ complexity: "SPECIALIST" }).subtotalMinor).toBe(80_000_000);
    expect(price({ complexity: "SPECIALIST" }).appliedComplexityBps).toBe(16_000);
  });

  it("applies the tightest matching rush band", () => {
    const rush = price({ deadline: new Date("2026-01-01T21:00:00Z") });
    expect(rush.appliedRushBps).toBe(15_000);
    expect(rush.subtotalMinor).toBe(75_000_000);
  });

  it("charges no rush premium for deadlines outside every band", () => {
    expect(price().appliedRushBps).toBe(10_000);
  });

  it("enforces the minimum charge on very small jobs", () => {
    const small = price({ wordCount: 100 });
    expect(small.minimumApplied).toBe(true);
    expect(small.subtotalMinor).toBe(rule.minimumChargeMinor);
  });

  it("charges for extra files, formatting and research", () => {
    const result = price({ fileCount: 3, needsFormatting: true, needsResearch: true });
    expect(result.subtotalMinor).toBe(50_000_000 + 10_000_000 + 500_000 + 1_000_000);
  });

  it("adds tax on top of the subtotal", () => {
    const result = price();
    expect(result.taxMinor).toBe(9_000_000);
    expect(result.totalMinor).toBe(59_000_000);
  });

  it("keeps the line items consistent with the subtotal", () => {
    const result = price({ fileCount: 2, needsResearch: true });
    const sum = result.lines.reduce((total, line) => total + line.totalMinor, 0);
    expect(sum).toBe(result.subtotalMinor);
  });

  it("returns integer minor units only", () => {
    const result = price({ wordCount: 1_337, complexity: "TECHNICAL", fileCount: 2 });
    for (const value of [result.subtotalMinor, result.taxMinor, result.totalMinor]) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe("rush bands", () => {
  it("measures the hours remaining without going negative", () => {
    expect(hoursUntil(new Date("2026-01-01T21:00:00Z"), now)).toBe(12);
    expect(hoursUntil(new Date("2025-12-01T09:00:00Z"), now)).toBe(0);
  });

  it("falls back to no premium when nothing matches", () => {
    expect(rushMultiplierBps(rule, 500)).toBe(10_000);
  });
});
