import type { Complexity } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/lib/errors";
import { getSetting } from "@/server/services/settings";

const BPS = 10_000;

export type PricingInputs = {
  wordCount: number;
  complexity: Complexity;
  deadline: Date;
  fileCount: number;
  needsFormatting: boolean;
  needsResearch: boolean;
  now?: Date;
};

export type PricingRuleSnapshot = {
  currency: string;
  baseRatePerWordMinor: number;
  minimumChargeMinor: number;
  extraFilePercent: number;
  formattingFeeMinor: number;
  researchFeeMinor: number;
  complexityMultipliers: { complexity: Complexity; multiplierBps: number }[];
  rushMultipliers: { maxHours: number; multiplierBps: number }[];
};

export type PricingLine = {
  description: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
};

export type PricingBreakdown = {
  currency: string;
  lines: PricingLine[];
  subtotalMinor: number;
  taxMinor: number;
  taxPercent: number;
  taxLabel: string;
  totalMinor: number;
  appliedComplexityBps: number;
  appliedRushBps: number;
  minimumApplied: boolean;
};

export function hoursUntil(deadline: Date, now: Date): number {
  return Math.max(0, (deadline.getTime() - now.getTime()) / 3_600_000);
}

export function complexityMultiplierBps(
  rule: PricingRuleSnapshot,
  complexity: Complexity,
): number {
  return (
    rule.complexityMultipliers.find((entry) => entry.complexity === complexity)
      ?.multiplierBps ?? BPS
  );
}

/// The tightest matching rush band wins; a deadline outside every band is 1.0x.
export function rushMultiplierBps(rule: PricingRuleSnapshot, hours: number): number {
  const matching = rule.rushMultipliers
    .filter((entry) => hours <= entry.maxHours)
    .sort((a, b) => a.maxHours - b.maxHours);
  return matching[0]?.multiplierBps ?? BPS;
}

/// Base rate x word count x complexity x rush, plus configurable add-ons and a
/// minimum charge floor. Pure so it can be exercised without a database.
export function calculatePrice(
  rule: PricingRuleSnapshot,
  inputs: PricingInputs,
  tax: { percent: number; label: string },
): PricingBreakdown {
  const now = inputs.now ?? new Date();
  const words = Math.max(0, Math.round(inputs.wordCount));
  const complexityBps = complexityMultiplierBps(rule, inputs.complexity);
  const rushBps = rushMultiplierBps(rule, hoursUntil(inputs.deadline, now));

  const baseMinor = Math.round(
    (words * rule.baseRatePerWordMinor * complexityBps * rushBps) / (BPS * BPS),
  );

  const lines: PricingLine[] = [
    {
      description: `Service fee (${words.toLocaleString()} words)`,
      quantity: words,
      unitPriceMinor: rule.baseRatePerWordMinor,
      totalMinor: baseMinor,
    },
  ];

  const extraFiles = Math.max(0, inputs.fileCount - 1);
  if (extraFiles > 0 && rule.extraFilePercent > 0) {
    const perFileMinor = Math.round((baseMinor * rule.extraFilePercent) / 100);
    lines.push({
      description: `Additional document handling (${extraFiles})`,
      quantity: extraFiles,
      unitPriceMinor: perFileMinor,
      totalMinor: perFileMinor * extraFiles,
    });
  }

  if (inputs.needsFormatting && rule.formattingFeeMinor > 0) {
    lines.push({
      description: "Document formatting",
      quantity: 1,
      unitPriceMinor: rule.formattingFeeMinor,
      totalMinor: rule.formattingFeeMinor,
    });
  }

  if (inputs.needsResearch && rule.researchFeeMinor > 0) {
    lines.push({
      description: "Additional research",
      quantity: 1,
      unitPriceMinor: rule.researchFeeMinor,
      totalMinor: rule.researchFeeMinor,
    });
  }

  const computed = lines.reduce((sum, line) => sum + line.totalMinor, 0);
  const minimumApplied = computed < rule.minimumChargeMinor;
  if (minimumApplied) {
    lines.push({
      description: "Minimum charge adjustment",
      quantity: 1,
      unitPriceMinor: rule.minimumChargeMinor - computed,
      totalMinor: rule.minimumChargeMinor - computed,
    });
  }

  const subtotalMinor = minimumApplied ? rule.minimumChargeMinor : computed;
  const taxMinor = Math.round((subtotalMinor * tax.percent) / 100);

  return {
    currency: rule.currency,
    lines,
    subtotalMinor,
    taxMinor,
    taxPercent: tax.percent,
    taxLabel: tax.label,
    totalMinor: subtotalMinor + taxMinor,
    appliedComplexityBps: complexityBps,
    appliedRushBps: rushBps,
    minimumApplied,
  };
}

export async function loadPricingRule(serviceId: string): Promise<PricingRuleSnapshot> {
  const rule = await prisma.pricingRule.findFirst({
    where: { serviceId, isActive: true },
    orderBy: { updatedAt: "desc" },
    include: { complexityMultipliers: true, rushMultipliers: true },
  });
  if (!rule) throw new NotFoundError("No active pricing rule for this service");
  return {
    currency: rule.currency,
    baseRatePerWordMinor: rule.baseRatePerWordMinor,
    minimumChargeMinor: rule.minimumChargeMinor,
    extraFilePercent: rule.extraFilePercent,
    formattingFeeMinor: rule.formattingFeeMinor,
    researchFeeMinor: rule.researchFeeMinor,
    complexityMultipliers: rule.complexityMultipliers.map((entry) => ({
      complexity: entry.complexity,
      multiplierBps: entry.multiplierBps,
    })),
    rushMultipliers: rule.rushMultipliers.map((entry) => ({
      maxHours: entry.maxHours,
      multiplierBps: entry.multiplierBps,
    })),
  };
}

export async function estimateForService(
  serviceId: string,
  inputs: PricingInputs,
): Promise<PricingBreakdown> {
  const [rule, percent, label] = await Promise.all([
    loadPricingRule(serviceId),
    getSetting("billing.taxPercent"),
    getSetting("billing.taxLabel"),
  ]);
  return calculatePrice(rule, inputs, { percent, label });
}
