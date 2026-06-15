import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStake } from "./useStake.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
const VALIDATOR = "0x3D58a5475c1336b0A755c3aBd298CeB9b7BB9CDe" as const;

// Client seam + the two wagmi hooks the flow uses are stubbed; the mutation and
// its invalidation logic stay real (a fresh QueryClient per test).
const getAllowance = vi.fn();
const approve = vi.fn();
const stake = vi.fn();
const waitForTransactionReceipt = vi.fn();

const client = {
  config: { chainId: 1 },
  token: { getAllowance, approve },
  staking: { stake },
} as unknown as SafeStakeClient;

vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));
vi.mock("wagmi", () => ({
  useConnection: () => ({ address: ACCOUNT }),
  usePublicClient: () => ({ waitForTransactionReceipt }),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useStake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    waitForTransactionReceipt.mockResolvedValue({ status: "success" });
    approve.mockResolvedValue("0xapprove");
    stake.mockResolvedValue("0xstake");
  });

  it("skips approve and stakes directly when the allowance already covers the amount", async () => {
    getAllowance.mockResolvedValue(1000n);
    const { result } = renderHook(() => useStake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(approve).not.toHaveBeenCalled();
    expect(stake).toHaveBeenCalledWith(VALIDATOR, 100n);
    expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: "0xstake" });
    expect(result.current.step).toBe("idle");
  });

  it("approves first (and waits) when the allowance is short, then stakes", async () => {
    getAllowance.mockResolvedValue(0n);
    const approveWait = deferred<{ status: string }>();
    const stakeWait = deferred<{ status: string }>();
    waitForTransactionReceipt
      .mockReturnValueOnce(approveWait.promise)
      .mockReturnValueOnce(stakeWait.promise);

    const { result } = renderHook(() => useStake(), { wrapper });
    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));

    // Approval tx in flight: step reflects it, stake not yet sent.
    await waitFor(() => expect(result.current.step).toBe("approving"));
    expect(approve).toHaveBeenCalledWith(100n);
    expect(stake).not.toHaveBeenCalled();

    // Approval mined → flow advances to staking.
    act(() => approveWait.resolve({ status: "success" }));
    await waitFor(() => expect(result.current.step).toBe("staking"));
    expect(stake).toHaveBeenCalledWith(VALIDATOR, 100n);

    act(() => stakeWait.resolve({ status: "success" }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.step).toBe("idle");
  });

  it("invalidates the balance, allowance, staked-balance and validator-stakes reads on success", async () => {
    getAllowance.mockResolvedValue(1000n);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useStake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = invalidate.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(["safe-stake", "balance", 1, ACCOUNT]);
    expect(keys).toContainEqual(["safe-stake", "allowance", 1, ACCOUNT]);
    expect(keys).toContainEqual(["safe-stake", "staked-balance", 1]);
    expect(keys).toContainEqual(["safe-stake", "validator-stakes", 1]);
  });

  it("surfaces a write failure as an error and resets the step to idle", async () => {
    getAllowance.mockResolvedValue(1000n);
    stake.mockRejectedValue(new Error("user rejected"));
    const { result } = renderHook(() => useStake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("user rejected");
    expect(result.current.step).toBe("idle");
  });
});
