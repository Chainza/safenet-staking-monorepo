import { describe, expect, it } from "vitest";
import { parseEther } from "viem";
import { formatCompactToken, formatToken, truncateHash } from "./format.js";

describe("formatToken", () => {
  it("groups thousands and fixes two decimals", () => {
    expect(formatToken(parseEther("8200.456"))).toBe("8,200.46");
  });
});

describe("formatCompactToken", () => {
  it("abbreviates thousands and millions", () => {
    expect(formatCompactToken(parseEther("8200"))).toBe("8.2K");
    expect(formatCompactToken(parseEther("1250000"))).toBe("1.25M");
  });

  it("keeps small amounts as-is, up to two decimals", () => {
    expect(formatCompactToken(parseEther("750"))).toBe("750");
    expect(formatCompactToken(parseEther("12.345"))).toBe("12.35");
    expect(formatCompactToken(0n)).toBe("0");
  });
});

describe("truncateHash", () => {
  it("keeps short values intact and truncates long ones", () => {
    expect(truncateHash("0x1234")).toBe("0x1234");
    expect(truncateHash("0x1234567890abcdef")).toBe("0x1234…cdef");
  });
});
