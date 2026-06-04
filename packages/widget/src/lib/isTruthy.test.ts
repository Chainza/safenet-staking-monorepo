import { describe, expect, it } from "vitest";
import { isTruthy } from "./isTruthy.js";

describe("isTruthy", () => {
  it("returns false for falsy values", () => {
    expect([null, undefined, false, 0, "", Number.NaN].every((v) => !isTruthy(v))).toBe(true);
  });

  it("returns true for truthy values", () => {
    expect([1, "a", {}, [], true].every(isTruthy)).toBe(true);
  });

  it("narrows out null/undefined when filtering", () => {
    const result = ["a", undefined, "b", null].filter(isTruthy);
    // Type is now string[]; .toUpperCase() would not compile on (string | undefined | null).
    expect(result.map((s) => s.toUpperCase())).toEqual(["A", "B"]);
  });
});
