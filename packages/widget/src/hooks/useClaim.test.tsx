import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "@chainza/safenet-staking-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useClaim } from "./useClaim.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
const STAKING = "0x115E78f160e1E3eF163B05C84562Fa16fA338509" as const;
const TOKEN = "0x5aFE3855358E112B5647B952709E6165e1c1eEEe" as const;
const MERKLE_DROP = "0xe5139Fc0FB8eae81e30d8a85C22E88c6757120f2" as const;
const SAFE_TX_HASH = `0x${"5a".repeat(32)}`;
const addresses = { staking: STAKING, token: TOKEN, merkleDrop: MERKLE_DROP };

// Client seam + the wagmi hooks behind it are stubbed; the mutation and its
// invalidation logic stay real (a fresh QueryClient per test). `connectorType`
// switches between a regular wallet and the Safe App connector.
const claimWithdrawal = vi.fn();
const encodeClaimWithdrawal = vi.fn();
const waitForTransactionReceipt = vi.fn();
const sendCalls = vi.fn();
const waitForCallsStatus = vi.fn();
const safeThreshold = vi.fn();
let connectorType = "injected";

const client = {
  config: { chainId: 1, addresses },
  staking: { claimWithdrawal, encodeClaimWithdrawal },
} as unknown as SafeStakeClient;

vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));
vi.mock("wagmi", () => ({
  useConnection: () => ({ address: ACCOUNT, connector: { type: connectorType } }),
  usePublicClient: () => ({ waitForTransactionReceipt, readContract: safeThreshold }),
  useWalletClient: () => ({
    data: { account: { address: ACCOUNT }, sendCalls, waitForCallsStatus },
  }),
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
    encodeClaimWithdrawal.mockReturnValue("0xencoded");
    sendCalls.mockResolvedValue({ id: SAFE_TX_HASH });
    // A multisig by default: Safe-path flows end `proposed` without waiting.
    safeThreshold.mockResolvedValue(2n);
    connectorType = "injected";
  });

  it("proposes the claim in the Safe instead of sending it, and invalidates nothing", async () => {
    connectorType = "safe";
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useClaim(), { wrapper });

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sendCalls).toHaveBeenCalledWith({ calls: [{ to: STAKING, data: "0xencoded" }] });
    expect(claimWithdrawal).not.toHaveBeenCalled();
    expect(waitForTransactionReceipt).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(result.current.data).toEqual({ status: "proposed", safeTxHash: SAFE_TX_HASH });
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

  it("fails the flow when the tx mines but reverts", async () => {
    waitForTransactionReceipt.mockResolvedValue({ status: "reverted" });
    const { result } = renderHook(() => useClaim(), { wrapper });

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Transaction reverted on-chain (0xclaim)");
  });

  it("surfaces a write failure as an error", async () => {
    claimWithdrawal.mockRejectedValue(new Error("user rejected"));
    const { result } = renderHook(() => useClaim(), { wrapper });

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("user rejected");
  });
});
