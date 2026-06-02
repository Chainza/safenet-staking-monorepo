import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Widget } from "./Widget.js";

describe("Widget", () => {
  it("defaults to the dark theme, standalone mode and the stake tab", () => {
    const { container } = render(<Widget />);
    const root = container.querySelector(".safe-stake")!;
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.getAttribute("data-mode")).toBe("standalone");
    expect(screen.getByRole("tab", { name: "stake" }).getAttribute("aria-selected")).toBe("true");
  });

  it("shows a Connect control in standalone mode and connects on click", async () => {
    const user = userEvent.setup();
    render(<Widget />);
    await user.click(screen.getByRole("button", { name: /connect wallet/i }));
    // After connecting, the account pill replaces the connect button.
    expect(screen.queryByRole("button", { name: /connect wallet/i })).toBeNull();
    expect(screen.getByText(/0x7A16/)).toBeDefined();
  });

  it("hides its own connect control in inherit mode", () => {
    render(<Widget mode="inherit" />);
    expect(screen.queryByRole("button", { name: /connect wallet/i })).toBeNull();
  });

  it("switches tabs to reveal the matching panel", async () => {
    const user = userEvent.setup();
    render(<Widget />);
    await user.click(screen.getByRole("tab", { name: "unstake" }));
    expect(screen.getByText(/Staked/)).toBeDefined();

    await user.click(screen.getByRole("tab", { name: "claim" }));
    // Disconnected → empty claim state.
    expect(screen.getByText(/No pending withdrawals/)).toBeDefined();
  });

  it("lists claimable withdrawals once connected", async () => {
    const user = userEvent.setup();
    render(<Widget />);
    await user.click(screen.getByRole("button", { name: /connect wallet/i }));
    await user.click(screen.getByRole("tab", { name: "claim" }));
    expect(screen.getAllByText(/Ready to claim/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Claim" })).toBeDefined();
  });
});
