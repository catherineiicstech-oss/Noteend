import { describe, expect, it } from "vitest";
import { formatMoney, toMajor, toMinor } from "@/lib/money";

describe("money", () => {
  it("round-trips through minor units", () => {
    expect(toMinor(1234.56)).toBe(123456);
    expect(toMajor(123456)).toBe(1234.56);
  });

  it("rounds rather than truncating", () => {
    expect(toMinor(0.005)).toBe(1);
  });

  it("formats shilling amounts without decimals", () => {
    expect(formatMoney(50_000_00, "UGX")).not.toContain(".");
  });
});
