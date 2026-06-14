import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { parseEther } from "viem";
import { useStakeData } from "./useStakeData.js";
import { useWidgetStore } from "../store.js";
import { WagmiHarness, mainnetConfig } from "../test/wagmi.js";

// Every field is a live read via the bound core client — stub the client seam;
// the rest of the hook stays real.
const getBalance = vi.fn();
const getStake = vi.fn();
const getPendingWithdrawals = vi.fn();
const getWithdrawDelay = vi.fn();
vi.mock("./useSafeStakeClient.js", () => ({
  useSafeStakeClient: () =>
    ({
      config: { chainId: 1 },
      token: { getBalance },
      staking: { getStake, getPendingWithdrawals, getWithdrawDelay },
    }) as unknown as SafeStakeClient,
}));

// The validator set is registry + on-chain composition with its own suite
// (useValidators.test.tsx) — stub it with a fixed list here.
const VALIDATORS = [
  {
    address: "0x3D58a5475c1336b0A755c3aBd298CeB9b7BB9CDe",
    name: "Gnosis",
    totalStaked: parseEther("100"),
  },
  {
    address: "0x7B0A8EFA45dE81F11F2846EC28259B62155a2b37",
    name: "Greenfield",
    totalStaked: parseEther("50"),
  },
] as const;
vi.mock("./useValidators.js", () => ({ useValidators: () => VALIDATORS }));

const BALANCE = parseEther("12480.42");
const STAKED = parseEther("8200");
const WITHDRAWALS = [
  { amount: parseEther("750"), claimableAt: 100n },
  { amount: parseEther("1500"), claimableAt: 200n },
];
const WITHDRAW_DELAY = 604_800n; // 7 days

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
    getStake.mockResolvedValue(STAKED);
    getPendingWithdrawals.mockResolvedValue(WITHDRAWALS);
    getWithdrawDelay.mockResolvedValue(WITHDRAW_DELAY);
    useWidgetStore.setState({ selectedValidator: null });
  });

  it("zeroes account-scoped reads and withdrawals when disconnected", () => {
    const { result } = renderHook(() => useStakeData(), { wrapper: wrapper(false) });
    expect(result.current.walletBalance).toBe(0n);
    expect(result.current.stakedBalance).toBe(0n);
    expect(result.current.withdrawals).toHaveLength(0);
    // Validators are always listed (they don't depend on the connection).
    expect(result.current.validators.length).toBeGreaterThan(0);
    // The account-scoped queries never fire without an account.
    expect(getBalance).not.toHaveBeenCalled();
    expect(getStake).not.toHaveBeenCalled();
    expect(getPendingWithdrawals).not.toHaveBeenCalled();
  });

  it("reads the withdraw delay even while disconnected (contract-wide, no account)", async () => {
    const { result } = renderHook(() => useStakeData(), { wrapper: wrapper(false) });
    await waitFor(() => expect(result.current.withdrawDelaySec).toBe(WITHDRAW_DELAY));
    expect(getWithdrawDelay).toHaveBeenCalled();
  });

  it("populates every field from the client when connected", async () => {
    const { result } = renderHook(() => useStakeData(), { wrapper: wrapper(true) });
    // Each field is an on-chain read; they resolve async.
    await waitFor(() => expect(result.current.walletBalance).toBe(BALANCE));
    await waitFor(() => expect(result.current.stakedBalance).toBe(STAKED));
    await waitFor(() => expect(result.current.withdrawals).toEqual(WITHDRAWALS));
    await waitFor(() => expect(result.current.withdrawDelaySec).toBe(WITHDRAW_DELAY));
    // The stake is read for the selected (default first) validator.
    expect(getStake).toHaveBeenCalledWith(
      expect.any(String),
      result.current.selectedValidator?.address,
    );
  });

  it("selectValidator() switches the active validator (first is the default)", () => {
    const { result } = renderHook(() => useStakeData(), { wrapper: wrapper(true) });
    expect(result.current.selectedValidator?.address).toBe(VALIDATORS[0].address);
    const second = result.current.validators[1]!;
    act(() => result.current.selectValidator(second.address));
    expect(result.current.selectedValidator?.address).toBe(second.address);
  });
});
