import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PanelErrorBoundary } from "./PanelErrorBoundary.js";
import { logger } from "../lib/logger.js";

function Bomb(): never {
  throw new Error("render crashed");
}

describe("PanelErrorBoundary", () => {
  beforeEach(() => {
    // React re-reports caught render errors through console.error — keep the
    // test output clean without hiding the assertions below.
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(logger, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders its children while nothing throws", () => {
    render(
      <PanelErrorBoundary>
        <span>all good</span>
      </PanelErrorBoundary>,
    );
    expect(screen.getByText("all good")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("swaps a crashing child for the inline notice and logs the error", () => {
    render(
      <PanelErrorBoundary>
        <Bomb />
      </PanelErrorBoundary>,
    );
    expect(screen.getByRole("alert").textContent).toMatch(/something went wrong/i);
    expect(logger.error).toHaveBeenCalledWith(
      "panel render failed:",
      expect.objectContaining({ message: "render crashed" }),
      expect.anything(),
    );
  });
});
