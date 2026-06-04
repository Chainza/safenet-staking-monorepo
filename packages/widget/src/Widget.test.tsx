import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Widget } from "./Widget.js";
import { useWidgetStore } from "./store.js";
import { WagmiHarness, mainnetConfig } from "./test/wagmi.js";

describe("Widget", () => {
  // The store is module-global; reset shared UI state between cases.
  beforeEach(() =>
    useWidgetStore.setState({ resolvedMode: "standalone", tab: "stake", selectedValidator: null }),
  );

  it("defaults to dark theme, standalone mode and the stake tab", () => {
    const { container } = render(<Widget />);
    const root = container.querySelector(".safe-stake")!;
    expect(root.getAttribute("data-theme")).toBe("dark");
    // No host WagmiProvider → auto resolves to standalone.
    expect(root.getAttribute("data-mode")).toBe("standalone");
    expect(screen.getByRole("tab", { name: "stake" }).getAttribute("aria-selected")).toBe("true");
  });

  it("renders its own Connect control in standalone mode", () => {
    render(<Widget />);
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeDefined();
  });

  it("switches tabs to reveal the matching panel", async () => {
    const user = userEvent.setup();
    render(<Widget />);
    await user.click(screen.getByRole("tab", { name: "unstake" }));
    expect(screen.getByText(/Staked/)).toBeDefined();

    await user.click(screen.getByRole("tab", { name: "claim" }));
    expect(screen.getByText(/No pending withdrawals/)).toBeDefined();
  });

  it("reuses a host wagmi config (inherit) without its own connect control", async () => {
    const { container } = render(
      <WagmiHarness config={mainnetConfig(true)}>
        <Widget mode="auto" />
      </WagmiHarness>,
    );
    const root = container.querySelector(".safe-stake")!;
    expect(root.getAttribute("data-mode")).toBe("inherit");
    expect(screen.queryByRole("button", { name: /connect wallet/i })).toBeNull();
  });

  it("reflects the host connection: lists claimable withdrawals once connected", async () => {
    const user = userEvent.setup();
    render(
      <WagmiHarness config={mainnetConfig(true)}>
        <Widget mode="inherit" />
      </WagmiHarness>,
    );
    // Host reconnects the mock account on mount → data populates.
    await user.click(screen.getByRole("tab", { name: "claim" }));
    await waitFor(() =>
      expect(screen.getAllByText(/Ready to claim/i).length).toBeGreaterThan(0),
    );
    expect(screen.getByRole("button", { name: "Claim" })).toBeDefined();
  });

  it('shows guidance when mode="inherit" has no host WagmiProvider', () => {
    render(<Widget mode="inherit" />);
    expect(screen.getByText(/requires the host app to provide a WagmiProvider/i)).toBeDefined();
  });
});
