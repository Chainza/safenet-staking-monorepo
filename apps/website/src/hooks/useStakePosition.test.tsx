import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { parseEther } from "viem";
import { splitWithdrawals, stakePositionQueryKey, useStakePosition } from "./useStakePosition.js";
import { WagmiHarness, mainnetConfig, TEST_ADDRESS } from "../test/wagmi.js";

// Stub core's reads (the RPC boundary); config resolution stays real so the
// hook is exercised against the actual mainnet deployment addresses.
// `vi.hoisted`: the factory reads these while the module graph loads (the
// hook imports core), before plain top-level consts would be initialized.
const { isSanctioned, getTotalStakerStakes, getPendingWithdrawals } = vi.hoisted(() => ({
  isSanctioned: vi.fn(),
  getTotalStakerStakes: vi.fn(),
  getPendingWithdrawals: vi.fn(),
}));
vi.mock("@chainza/safenet-staking-core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@chainza/safenet-staking-core")>()),
  sanctions: { isSanctioned },
  staking: { getTotalStakerStakes, getPendingWithdrawals },
}));

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

const matured = { amount: parseEther("750"), claimableAt: 1n }; // 1970 → claimable
const pending = { amount: parseEther("250"), claimableAt: 4_000_000_000n }; // 2096 → unstaking

describe("splitWithdrawals", () => {
  const NOW_MS = 1_000_000_000_000;

  it("sums matured entries as claimable and the rest as unstaking", () => {
    const queue = [
      { amount: 5n, claimableAt: 1n },
      { amount: 7n, claimableAt: 2_000_000_000n },
      { amount: 3n, claimableAt: 1_000_000_000n }, // matures exactly now
    ];
    expect(splitWithdrawals(queue, NOW_MS)).toEqual({ unstaking: 7n, claimable: 8n });
  });

  it("returns zeros for an empty queue", () => {
    expect(splitWithdrawals([], NOW_MS)).toEqual({ unstaking: 0n, claimable: 0n });
  });
});

describe("stakePositionQueryKey", () => {
  it("namespaces the key by chain and account", () => {
    expect(stakePositionQueryKey(1, TEST_ADDRESS)).toEqual([
      "safe-stake",
      "stake-position",
      1,
      TEST_ADDRESS,
    ]);
  });
});

describe("useStakePosition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSanctioned.mockResolvedValue(false);
    getTotalStakerStakes.mockResolvedValue(parseEther("8200"));
    getPendingWithdrawals.mockResolvedValue([matured, pending]);
  });

  it("stays disabled (no reads) while disconnected", () => {
    const { result } = renderHook(() => useStakePosition(), { wrapper: wrapper(false) });
    expect(result.current.fetchStatus).toBe("idle");
    expect(isSanctioned).not.toHaveBeenCalled();
    expect(getTotalStakerStakes).not.toHaveBeenCalled();
  });

  it("reads the total stake and splits the withdrawal queue for a clean account", async () => {
    const { result } = renderHook(() => useStakePosition(), { wrapper: wrapper(true) });
    await waitFor(() =>
      expect(result.current.data).toEqual({
        staked: parseEther("8200"),
        unstaking: parseEther("250"),
        claimable: parseEther("750"),
      }),
    );
    expect(isSanctioned).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ chainId: 1 }),
      TEST_ADDRESS,
    );
    expect(getTotalStakerStakes).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      TEST_ADDRESS,
    );
  });

  it("resolves to null and reads nothing else for a sanctioned account", async () => {
    isSanctioned.mockResolvedValue(true);
    const { result } = renderHook(() => useStakePosition(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(getTotalStakerStakes).not.toHaveBeenCalled();
    expect(getPendingWithdrawals).not.toHaveBeenCalled();
  });

  it("fails closed: a failed screen is an error and skips the position reads", async () => {
    isSanctioned.mockRejectedValue(new Error("rpc down"));
    const { result } = renderHook(() => useStakePosition(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(getTotalStakerStakes).not.toHaveBeenCalled();
  });
});
