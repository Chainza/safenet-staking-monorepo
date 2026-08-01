import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useClaimRewards } from "./useClaimRewards.js";
import type { RewardProof } from "./useRewardProof.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
const ROOT = `0x${"aa".repeat(32)}` as const;
const PATH = [`0x${"bb".repeat(32)}`] as const;

// Client seam, proof fetch and the two wagmi hooks are stubbed; the mutation
// and its invalidation logic stay real (a fresh QueryClient per test).
const claim = vi.fn();
const waitForTransactionReceipt = vi.fn();

const client = {
  config: { chainId: 1 },
  rewards: { claim },
} as unknown as SafeStakeClient;

let proof: RewardProof | null;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));
vi.mock("./useRewardProof.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./useRewardProof.js")>()),
  useRewardProof: () => ({ data: proof }),
}));
vi.mock("wagmi", () => ({
  useConnection: () => ({ address: ACCOUNT }),
  usePublicClient: () => ({ waitForTransactionReceipt }),
}));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useClaimRewards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    proof = { cumulativeAmount: "1000", merkleRoot: ROOT, proof: [...PATH] };
    waitForTransactionReceipt.mockResolvedValue({ status: "success" });
    claim.mockResolvedValue("0xrewards");
  });

  it("claims with the proof's cumulative amount, root and path, then waits for the receipt", async () => {
    const { result } = renderHook(() => useClaimRewards(), { wrapper });

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(claim).toHaveBeenCalledWith(ACCOUNT, 1000n, ROOT, PATH);
    expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: "0xrewards" });
  });

  it("invalidates the claimed counter, wallet balance and proof on success", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useClaimRewards(), { wrapper });

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = invalidate.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(["safe-stake", "cumulative-claimed", 1, ACCOUNT]);
    expect(keys).toContainEqual(["safe-stake", "balance", 1, ACCOUNT]);
    expect(keys).toContainEqual(["safe-stake", "reward-proof", ACCOUNT]);
  });

  it("errors without a usable proof instead of sending a tx", async () => {
    proof = { cumulativeAmount: "1000", merkleRoot: ROOT, proof: null };
    const { result } = renderHook(() => useClaimRewards(), { wrapper });

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/reward proof/i);
    expect(claim).not.toHaveBeenCalled();
  });

  it("surfaces a write failure as an error", async () => {
    claim.mockRejectedValue(new Error("user rejected"));
    const { result } = renderHook(() => useClaimRewards(), { wrapper });

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("user rejected");
  });
});
