import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "@chainza/safenet-staking-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStake } from "./useStake.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
const VALIDATOR = "0x3D58a5475c1336b0A755c3aBd298CeB9b7BB9CDe" as const;
const STAKING = "0x115E78f160e1E3eF163B05C84562Fa16fA338509" as const;
const TOKEN = "0x5aFE3855358E112B5647B952709E6165e1c1eEEe" as const;
const MERKLE_DROP = "0xe5139Fc0FB8eae81e30d8a85C22E88c6757120f2" as const;
const SAFE_TX_HASH = `0x${"5a".repeat(32)}`;
const addresses = { staking: STAKING, token: TOKEN, merkleDrop: MERKLE_DROP };

// Client seam + the wagmi hooks behind it are stubbed; the mutation and its
// invalidation logic stay real (a fresh QueryClient per test). `connectorType`
// switches between a regular wallet and the Safe App connector.
const getAllowance = vi.fn();
const approve = vi.fn();
const stake = vi.fn();
const encodeApprove = vi.fn();
const encodeStake = vi.fn();
const waitForTransactionReceipt = vi.fn();
const sendCalls = vi.fn();
const waitForCallsStatus = vi.fn();
const safeThreshold = vi.fn();
const accountCode = vi.fn();
let connectorType = "injected";

const client = {
  config: { chainId: 1, addresses },
  token: { getAllowance, approve, encodeApprove },
  staking: { stake, encodeStake },
} as unknown as SafeStakeClient;

vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));
vi.mock("wagmi", () => ({
  useConnection: () => ({ address: ACCOUNT, connector: { type: connectorType } }),
  // No code at the account: a regular wallet unless the Safe App connector is used.
  usePublicClient: () => ({
    waitForTransactionReceipt,
    readContract: safeThreshold,
    getCode: accountCode,
  }),
  useWalletClient: () => ({
    data: { account: { address: ACCOUNT }, sendCalls, waitForCallsStatus },
  }),
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
    encodeApprove.mockReturnValue("0xapprovedata");
    encodeStake.mockReturnValue("0xstakedata");
    sendCalls.mockResolvedValue({ id: SAFE_TX_HASH });
    // A multisig by default: Safe-path flows end `proposed` without waiting.
    safeThreshold.mockResolvedValue(2n);
    accountCode.mockResolvedValue(undefined);
    connectorType = "injected";
  });

  it("proposes approve + stake as one Safe batch when the allowance is short", async () => {
    connectorType = "safe";
    getAllowance.mockResolvedValue(0n);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useStake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(encodeApprove).toHaveBeenCalledWith(STAKING, 100n);
    expect(encodeStake).toHaveBeenCalledWith(VALIDATOR, 100n);
    expect(sendCalls).toHaveBeenCalledWith({
      calls: [
        { to: TOKEN, data: "0xapprovedata" },
        { to: STAKING, data: "0xstakedata" },
      ],
    });
    expect(approve).not.toHaveBeenCalled();
    expect(stake).not.toHaveBeenCalled();
    expect(waitForTransactionReceipt).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(result.current.data).toEqual({ status: "proposed", safeTxHash: SAFE_TX_HASH });
    expect(result.current.step).toBe("idle");
  });

  it("confirms a 1-of-1 Safe's executed batch and refreshes the reads it moved", async () => {
    connectorType = "safe";
    getAllowance.mockResolvedValue(0n);
    safeThreshold.mockResolvedValue(1n);
    waitForCallsStatus.mockResolvedValue({
      status: "success",
      receipts: [{ transactionHash: "0xexec" }, { transactionHash: "0xexec" }],
    });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useStake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: "0xexec" });
    expect(result.current.data).toEqual({ status: "confirmed", hash: "0xexec" });
    const keys = invalidate.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(["safe-stake", "balance", 1, ACCOUNT]);
    expect(keys).toContainEqual(["safe-stake", "staked-balance", 1]);
  });

  it("routes a Safe connected over WalletConnect to the Safe batch too", async () => {
    connectorType = "walletConnect";
    accountCode.mockResolvedValue("0x6080");
    getAllowance.mockResolvedValue(0n);
    const { result } = renderHook(() => useStake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sendCalls).toHaveBeenCalledTimes(1);
    expect(approve).not.toHaveBeenCalled();
    expect(stake).not.toHaveBeenCalled();
    expect(result.current.data).toEqual({ status: "proposed", safeTxHash: SAFE_TX_HASH });
  });

  it("sends nothing when the Safe detection read fails", async () => {
    connectorType = "walletConnect";
    accountCode.mockRejectedValue(new Error("rpc down"));
    getAllowance.mockResolvedValue(0n);
    const { result } = renderHook(() => useStake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("rpc down");
    expect(sendCalls).not.toHaveBeenCalled();
    expect(approve).not.toHaveBeenCalled();
    expect(stake).not.toHaveBeenCalled();
  });

  it("proposes the stake alone in the Safe when the allowance already covers it", async () => {
    connectorType = "safe";
    getAllowance.mockResolvedValue(1000n);
    const { result } = renderHook(() => useStake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(encodeApprove).not.toHaveBeenCalled();
    expect(sendCalls).toHaveBeenCalledWith({ calls: [{ to: STAKING, data: "0xstakedata" }] });
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

  it("fails the flow when the stake tx mines but reverts", async () => {
    getAllowance.mockResolvedValue(1000n);
    waitForTransactionReceipt.mockResolvedValue({ status: "reverted" });
    const { result } = renderHook(() => useStake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Transaction reverted on-chain (0xstake)");
    expect(result.current.step).toBe("idle");
  });

  it("stops before staking when the approve tx mines but reverts", async () => {
    getAllowance.mockResolvedValue(0n);
    waitForTransactionReceipt.mockResolvedValue({ status: "reverted" });
    const { result } = renderHook(() => useStake(), { wrapper });

    act(() => result.current.mutate({ validator: VALIDATOR, amount: 100n }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Transaction reverted on-chain (0xapprove)");
    expect(stake).not.toHaveBeenCalled();
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
