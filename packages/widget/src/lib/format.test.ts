import { describe, expect, it } from "vitest";
import { parseEther } from "viem";
import { formatToken, truncateAddress, formatCountdown } from "./format.js";

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
