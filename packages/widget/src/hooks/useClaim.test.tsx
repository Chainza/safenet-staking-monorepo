import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useClaim } from "./useClaim.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

// Client seam + the two wagmi hooks the flow uses are stubbed; the mutation and
// its invalidation logic stay real (a fresh QueryClient per test).
const claimWithdrawal = vi.fn();
const waitForTransactionReceipt = vi.fn();

const client = {
  config: { chainId: 1 },
  staking: { claimWithdrawal },
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

describe("useClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    waitForTransactionReceipt.mockResolvedValue({ status: "success" });
    claimWithdrawal.mockResolvedValue("0xclaim");
  });

  it("claims the next matured withdrawal and waits for its receipt", async () => {
    const { result } = renderHook(() => useClaim(), { wrapper });

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(claimWithdrawal).toHaveBeenCalledWith();
    expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: "0xclaim" });
  });

  it("invalidates the withdrawals and wallet-balance reads on success", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useClaim(), { wrapper });

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = invalidate.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(["safe-stake", "withdrawals", 1, ACCOUNT]);
    expect(keys).toContainEqual(["safe-stake", "balance", 1, ACCOUNT]);
  });

  it("surfaces a write failure as an error", async () => {
    claimWithdrawal.mockRejectedValue(new Error("user rejected"));
    const { result } = renderHook(() => useClaim(), { wrapper });

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("user rejected");
  });
});
