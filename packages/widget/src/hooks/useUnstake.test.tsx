import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUnstake } from "./useUnstake.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
const VALIDATOR = "0x3D58a5475c1336b0A755c3aBd298CeB9b7BB9CDe" as const;

// Client seam + the two wagmi hooks the flow uses are stubbed; the mutation and
// its invalidation logic stay real (a fresh QueryClient per test).
const initiateWithdrawal = vi.fn();
const waitForTransactionReceipt = vi.fn();

const client = {
  config: { chainId: 1 },
  staking: { initiateWithdrawal },
} as unknown as SafeStakeClient;

vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));
vi.mock("wagmi", () => ({
  useConnection: () => ({ address: ACCOUNT }),
  usePublicClient: () => ({ waitForTransactionReceipt }),
}));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useUnstake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    waitForTransactionReceipt.mockResolvedValue({ status: "success" });
    initiateWithdrawal.mockResolvedValue("0xunstake");
  });

  it("initiates the withdrawal and waits for its receipt", async () => {
    const { result } = renderHook(() => useUnstake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(initiateWithdrawal).toHaveBeenCalledWith(VALIDATOR, 100n);
    expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: "0xunstake" });
  });

  it("invalidates the withdrawals, staked-balance and validator-stakes reads on success", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUnstake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = invalidate.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(["safe-stake", "withdrawals", 1, ACCOUNT]);
    expect(keys).toContainEqual(["safe-stake", "staked-balance", 1]);
    expect(keys).toContainEqual(["safe-stake", "validator-stakes", 1]);
  });

  it("surfaces a write failure as an error", async () => {
    initiateWithdrawal.mockRejectedValue(new Error("user rejected"));
    const { result } = renderHook(() => useUnstake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("user rejected");
  });
});
