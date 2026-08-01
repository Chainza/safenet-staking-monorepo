import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Address } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRewardProof, rewardProofQueryKey } from "./useRewardProof.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

let connectedAddress: Address | undefined = ACCOUNT;
vi.mock("wagmi", () => ({ useConnection: () => ({ address: connectedAddress }) }));

const fetchMock = vi.fn();

const PROOF = {
  cumulativeAmount: "1000",
  merkleRoot: `0x${"aa".repeat(32)}`,
  proof: [`0x${"bb".repeat(32)}`],
};

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useRewardProof", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    connectedAddress = ACCOUNT;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => PROOF });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("fetches the proof from the sharded registry path (lowercased address)", async () => {
    const { result } = renderHook(() => useRewardProof(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(PROOF);
    // First four address bytes shard the path: 0x70997970… → 70/99/79/70.
    expect(fetchMock).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/safe-fndn/safenet-beta-data/main/assets/rewards/proofs/70/99/79/70/0x70997970c51812dc3a010c7d01b50e0d17dc79c8.json",
    );
  });

  it("resolves null on a 404 (account has never accrued rewards)", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    const { result } = renderHook(() => useRewardProof(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("errors on any other HTTP failure", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const { result } = renderHook(() => useRewardProof(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/HTTP 500/);
  });

  it("stays disabled while disconnected", () => {
    connectedAddress = undefined;
    const { result } = renderHook(() => useRewardProof(), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("exposes an account-scoped query key", () => {
    expect(rewardProofQueryKey(ACCOUNT)).toEqual(["safe-stake", "reward-proof", ACCOUNT]);
  });
});
