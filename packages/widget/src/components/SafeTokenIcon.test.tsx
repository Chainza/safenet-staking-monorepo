import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { SafeTokenIcon } from "./SafeTokenIcon.js";

describe("SafeTokenIcon", () => {
  it("renders the SAFE mark as a decorative, sizable svg", () => {
    const { container } = render(<SafeTokenIcon className="ss:size-4" />);
    const svg = container.querySelector("svg")!;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute("viewBox")).toBe("0 0 35 35");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("class")).toContain("ss:size-4");
    // The brand-green disc plus the three glyph paths.
    expect(container.querySelector("rect")?.getAttribute("fill")).toBe("#12FF80");
    expect(container.querySelectorAll("path")).toHaveLength(3);
  });

  it("lets a caller override aria-hidden (e.g. when standalone/meaningful)", () => {
    const { container } = render(
      <SafeTokenIcon aria-hidden={false} role="img" aria-label="SAFE" />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("false");
    expect(svg.getAttribute("aria-label")).toBe("SAFE");
  });
});
