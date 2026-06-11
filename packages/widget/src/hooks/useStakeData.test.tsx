import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { parseEther } from "viem";
import { useStakeData } from "./useStakeData.js";
import { useWidgetStore } from "../store.js";
import { WagmiHarness, mainnetConfig } from "../test/wagmi.js";

// The wallet balance is a live read via the bound core client — stub the
// client seam; the rest of the hook stays real.
const getBalance = vi.fn();
vi.mock("./useSafeStakeClient.js", () => ({
  useSafeStakeClient: () =>
    ({ config: { chainId: 1 }, token: { getBalance } }) as unknown as SafeStakeClient,
}));

const BALANCE = parseEther("12480.42");

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

describe("useStakeData", () => {
  // The store is module-global; reset shared state between cases.
  beforeEach(() => {
    vi.clearAllMocks();
    getBalance.mockResolvedValue(BALANCE);
    useWidgetStore.setState({ selectedValidator: null });
  });

  it("zeroes balances and withdrawals when disconnected", () => {
    const { result } = renderHook(() => useStakeData(false), { wrapper: wrapper(false) });
    expect(result.current.walletBalance).toBe(0n);
    expect(result.current.stakedBalance).toBe(0n);
    expect(result.current.withdrawals).toHaveLength(0);
    // Validators are always listed (they don't depend on the connection).
    expect(result.current.validators.length).toBeGreaterThan(0);
    // The balance query never fires without an account.
    expect(getBalance).not.toHaveBeenCalled();
  });

  it("populates balances and withdrawals when connected", async () => {
    const { result } = renderHook(() => useStakeData(true), { wrapper: wrapper(true) });
    // walletBalance is the on-chain read; it resolves async.
    await waitFor(() => expect(result.current.walletBalance).toBe(BALANCE));
    expect(result.current.stakedBalance).toBeGreaterThan(0n);
    expect(result.current.withdrawals.length).toBeGreaterThan(0);
  });

  it("selectValidator() switches the active validator", () => {
    const { result } = renderHook(() => useStakeData(true), { wrapper: wrapper(true) });
    const second = result.current.validators[1]!;
    act(() => result.current.selectValidator(second.address));
    expect(result.current.selectedValidator.address).toBe(second.address);
  });

  it("exposes exactly one matured (claimable) withdrawal when connected", () => {
    const { result } = renderHook(() => useStakeData(true), { wrapper: wrapper(true) });
    const nowSec = BigInt(Math.floor(Date.now() / 1000));
    const matured = result.current.withdrawals.filter((w) => w.claimableAt <= nowSec);
    expect(matured).toHaveLength(1);
  });
});
