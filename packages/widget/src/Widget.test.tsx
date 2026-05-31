import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Widget } from "./Widget.js";

describe("Widget", () => {
  it("renders with default theme and mode", () => {
    render(<Widget />);
    expect(screen.getByText("SAFE Stake Widget")).toBeDefined();
    expect(screen.getByText(/theme: light/)).toBeDefined();
  });

  it("reflects provided props", () => {
    render(<Widget theme="dark" mode="inherit" />);
    expect(screen.getByText(/mode: inherit/)).toBeDefined();
  });
});
