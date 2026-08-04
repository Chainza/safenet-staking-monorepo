import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SafeStakeClient } from "safe-stake-core";
import { Widget } from "./Widget.js";
import { useWidgetStore } from "./store.js";
import { WagmiHarness, mainnetConfig } from "./test/wagmi.js";

// Stub the client seam so the connected case yields a matured withdrawal
// deterministically — the mock account's real on-chain queue is empty, and
// per repo convention specific values are stubbed rather than read from RPC.
// `claimableAt: 1n` (1970) is well past now → ClaimPanel marks it ready.
let sanctioned = false;
vi.mock("./hooks/useSafeStakeClient.js", () => ({
  useSafeStakeClient: () =>
    ({
      // No reward proof for the mock account (real 404) → rewards reads stay disabled.
      config: { chainId: 1 },
      token: {
        getBalance: async () => 0n,
        getMeta: async () => ({ name: "Safe Token", symbol: "SAFE", decimals: 18 }),
      },
      staking: {
        getStake: async () => 0n,
        getWithdrawDelay: async () => 604_800n,
        getTotalValidatorStakes: async () => [],
        getPendingWithdrawals: async () => [{ amount: 750n, claimableAt: 1n }],
      },
      sanctions: { isSanctioned: async () => sanctioned },
    }) as unknown as SafeStakeClient,
}));

describe("Widget", () => {
  // The store is module-global; reset shared UI state between cases.
  beforeEach(() => {
    sanctioned = false;
    useWidgetStore.setState({ resolvedMode: "standalone", tab: "stake", selectedValidator: null });
  });

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

    await user.click(screen.getByRole("tab", { name: "rewards" }));
    expect(screen.getByText(/No rewards yet/)).toBeDefined();
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
    await waitFor(() => expect(screen.getAllByText(/Ready to claim/i).length).toBeGreaterThan(0));
    expect(screen.getByRole("button", { name: "Claim next" })).toBeDefined();
  });

  it("replaces the action panels with a blocking notice for a sanctioned wallet", async () => {
    sanctioned = true;
    render(
      <WagmiHarness config={mainnetConfig(true)}>
        <Widget mode="inherit" />
      </WagmiHarness>,
    );
    // The oracle read resolves async → the panels give way to the alert.
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Address blocked"));
    expect(screen.queryByRole("tab", { name: "stake" })).toBeNull();
    // The Header survives so the account can still disconnect.
    expect(screen.getByText("SAFE")).toBeDefined();
  });

  it('shows guidance when mode="inherit" has no host WagmiProvider', () => {
    render(<Widget mode="inherit" />);
    expect(screen.getByText(/requires the host app to provide a WagmiProvider/i)).toBeDefined();
  });
});
