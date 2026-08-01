import { afterEach, describe, expect, it, vi } from "vitest";
import { isIframe } from "./isIframe.js";

describe("isIframe", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when the window is its own parent (top-level page)", () => {
    expect(isIframe()).toBe(false);
  });

  it("returns true when the window has a distinct parent (embedded)", () => {
    vi.spyOn(window, "parent", "get").mockReturnValue({} as Window);
    expect(isIframe()).toBe(true);
  });
});
