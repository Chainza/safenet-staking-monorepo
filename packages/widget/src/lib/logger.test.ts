import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger.js";

afterEach(() => vi.restoreAllMocks());

describe("logger", () => {
  it("prefixes each console level with the package name", () => {
    for (const level of ["log", "info", "warn", "error"] as const) {
      const spy = vi.spyOn(console, level).mockImplementation(() => {});
      logger[level]("hello", 42);
      expect(spy).toHaveBeenCalledWith("[safe-stake-widget]", "hello", 42);
    }
  });
});
