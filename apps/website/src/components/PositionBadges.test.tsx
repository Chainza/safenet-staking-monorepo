import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { parseEther } from "viem";
import { PositionBadges } from "./PositionBadges.js";
import type { StakePosition } from "../hooks/useStakePosition.js";

// Stub the data hook: the read itself is covered by useStakePosition.test.tsx —
// under test here is which badges render and how.
let position: StakePosition | null | undefined;
vi.mock("../hooks/useStakePosition.js", () => ({
  useStakePosition: () => ({ data: position }),
}));

function badges() {
  return within(screen.getByRole("list", { name: "Your staking position" })).getAllByRole(
    "listitem",
  );
}

describe("PositionBadges", () => {
  beforeEach(() => {
    position = { staked: parseEther("8200"), unstaking: 0n, claimable: 0n };
  });

  it("groups every segment in one container with a single token icon", () => {
    position = { staked: 1n, unstaking: 1n, claimable: 1n };
    const { container } = render(<PositionBadges />);
    expect(container.childElementCount).toBe(1);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(badges()).toHaveLength(3);
  });

  it("renders nothing until the position resolves", () => {
    position = undefined;
    const { container } = render(<PositionBadges />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing for a sanctioned account (null position)", () => {
    position = null;
    const { container } = render(<PositionBadges />);
    expect(container.innerHTML).toBe("");
  });

  it("always shows the staked segment", () => {
    render(<PositionBadges />);
    expect(badges()).toHaveLength(1);
    expect(badges()[0]!.textContent).toBe("8.2Kstaked");
  });

  it("describes every state with its exact amount in the hint tooltip", () => {
    position = { staked: parseEther("8200"), unstaking: 0n, claimable: parseEther("750") };
    render(<PositionBadges />);
    const tooltip = screen.getByRole("tooltip");
    // All three states are explained, including the zero one hidden from the pill.
    expect(tooltip.textContent).toContain("staked8,200.00 SAFE");
    expect(tooltip.textContent).toContain("unstaking0.00 SAFE");
    expect(tooltip.textContent).toContain("claimable750.00 SAFE");
    expect(tooltip.textContent).toContain("Claim it in the Claim tab");
  });

  it("wires the tooltip to a focusable pill for keyboard and screen-reader users", () => {
    render(<PositionBadges />);
    const pill = screen.getByRole("list", { name: "Your staking position" }).parentElement!;
    expect(pill.getAttribute("tabindex")).toBe("0");
    expect(pill.getAttribute("aria-describedby")).toBe(screen.getByRole("tooltip").id);
  });

  it("anchors the tooltip to the requested edge", () => {
    const { rerender } = render(<PositionBadges />);
    expect(screen.getByRole("tooltip").className).toContain("right-0");
    rerender(<PositionBadges tooltipAlign="left" />);
    expect(screen.getByRole("tooltip").className).toContain("left-0");
  });

  it("shows a zero stake rather than hiding it", () => {
    position = { staked: 0n, unstaking: 0n, claimable: 0n };
    render(<PositionBadges />);
    expect(badges()[0]!.textContent).toBe("0staked");
  });

  it("adds unstaking and claimable badges only while non-zero", () => {
    position = {
      staked: parseEther("8200"),
      unstaking: parseEther("250"),
      claimable: parseEther("750"),
    };
    render(<PositionBadges />);
    expect(badges().map((b) => b.textContent)).toEqual([
      "8.2Kstaked",
      "250unstaking",
      "750claimable",
    ]);
  });
});
