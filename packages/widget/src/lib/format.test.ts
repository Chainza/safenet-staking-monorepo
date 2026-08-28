import { describe, expect, it } from "vitest";
import { parseEther } from "viem";
import {
  formatToken,
  formatPercent,
  parseAmount,
  truncateAddress,
  formatCountdown,
  dayCount,
} from "./format.js";

describe("formatToken", () => {
  it("formats base units with grouping and 2 fraction digits", () => {
    expect(formatToken(parseEther("1234.5"))).toBe("1,234.50");
  });

  it("formats zero", () => {
    expect(formatToken(0n)).toBe("0.00");
  });

  it("honors a custom fraction-digit count", () => {
    expect(formatToken(parseEther("4821000"), 18, 0)).toBe("4,821,000");
  });
});

describe("formatPercent", () => {
  it("formats a fraction as a percentage, dropping trailing zeros", () => {
    expect(formatPercent(0.05)).toBe("5%");
  });

  it("rounds to 1 fraction digit by default", () => {
    expect(formatPercent(0.9914893617021276)).toBe("99.1%");
  });

  it("honors a custom fraction-digit count", () => {
    expect(formatPercent(0.99149, 2)).toBe("99.15%");
  });
});

describe("parseAmount", () => {
  it("parses a decimal string into base units", () => {
    expect(parseAmount("12.5", 18)).toBe(parseEther("12.5"));
  });

  it("scales by the given decimals", () => {
    expect(parseAmount("1.5", 6)).toBe(1_500_000n);
  });

  it("returns 0n for empty input", () => {
    expect(parseAmount("", 18)).toBe(0n);
  });

  it("returns 0n for malformed input instead of throwing", () => {
    expect(parseAmount("not-a-number", 18)).toBe(0n);
  });

  it("clamps negative input to 0n (amounts are non-negative)", () => {
    expect(parseAmount("-12.5", 18)).toBe(0n);
    expect(parseAmount("-0.000001", 6)).toBe(0n);
  });
});

describe("dayCount", () => {
  it("converts unix-second durations to whole days", () => {
    expect(dayCount(172_800n)).toBe(2);
    expect(dayCount(604_800n)).toBe(7);
  });

  it("truncates partial days", () => {
    expect(dayCount(90_000n)).toBe(1); // 25h
    expect(dayCount(0n)).toBe(0);
  });
});

describe("truncateAddress", () => {
  it("shortens a full address to head…tail", () => {
    expect(truncateAddress("0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326")).toBe("0x1f90…c326");
  });

  it("leaves short strings untouched", () => {
    expect(truncateAddress("0x1234")).toBe("0x1234");
  });
});

describe("formatCountdown", () => {
  const now = 1_000_000_000_000; // fixed reference, ms

  it("returns null once the target is in the past", () => {
    const past = BigInt(Math.floor(now / 1000) - 60);
    expect(formatCountdown(past, now)).toBeNull();
  });

  it("renders days and hours when more than a day remains", () => {
    const target = BigInt(Math.floor(now / 1000) + 3 * 86_400 + 3 * 3_600);
    expect(formatCountdown(target, now)).toBe("3d 3h");
  });

  it("renders minutes when under an hour remains", () => {
    const target = BigInt(Math.floor(now / 1000) + 30 * 60);
    expect(formatCountdown(target, now)).toBe("30m");
  });
});
