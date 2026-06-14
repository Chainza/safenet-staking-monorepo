import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { PendingWithdrawal, SafeStakeClient } from "safe-stake-core";
import { useWithdrawals } from "./useWithdrawals.js";
import { WagmiHarness, mainnetConfig, TEST_ADDRESS } from "../test/wagmi.js";

// Stub the client seam: what's under test here is the query itself (key,
// enabled gating, the read call). Client construction is covered by
// useSafeStakeClient.test.tsx.
const getPendingWithdrawals = vi.fn();
let client: SafeStakeClient | undefined;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));

function fakeClient(
  chainId: number,
  withdrawals: () => Promise<PendingWithdrawal[]>,
): SafeStakeClient {
  getPendingWithdrawals.mockImplementation(withdrawals);
  return {
    config: { chainId },
    staking: { getPendingWithdrawals },
  } as unknown as SafeStakeClient;
}

const QUEUE: PendingWithdrawal[] = [{ amount: 750n, claimableAt: 100n }];

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

describe("useWithdrawals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = fakeClient(1, async () => QUEUE);
  });

  it("stays disabled (no read, no data) while disconnected", () => {
    const { result } = renderHook(() => useWithdrawals(), { wrapper: wrapper(false) });
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
    expect(getPendingWithdrawals).not.toHaveBeenCalled();
  });

  it("stays disabled when the chain has no client (unsupported deployment)", () => {
    client = undefined;
    const { result } = renderHook(() => useWithdrawals(), { wrapper: wrapper(true) });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getPendingWithdrawals).not.toHaveBeenCalled();
  });

  it("reads the connected account's withdrawal queue through the client", async () => {
    const { result } = renderHook(() => useWithdrawals(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.data).toEqual(QUEUE));
    expect(getPendingWithdrawals).toHaveBeenCalledWith(TEST_ADDRESS);
  });

  it("refetches on chain switch instead of serving the previous chain's queue", async () => {
    const { result, rerender } = renderHook(() => useWithdrawals(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.data).toEqual(QUEUE));

    const next: PendingWithdrawal[] = [{ amount: 1n, claimableAt: 2n }];
    client = fakeClient(10, async () => next);
    rerender();
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toEqual(next));
  });

  it("surfaces read failures as a query error", async () => {
    client = fakeClient(1, async () => {
      throw new Error("rpc down");
    });
    const { result } = renderHook(() => useWithdrawals(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("rpc down");
    expect(result.current.data).toBeUndefined();
  });
});
