import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "@chainza/safenet-staking-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRewards } from "./useRewards.js";
import type { RewardProof } from "./useRewardProof.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
const ROOT = `0x${"aa".repeat(32)}` as const;

// The proof fetch and client seam are stubbed; the two on-chain queries and
// the derivation stay real (a fresh QueryClient per test).
let proof: RewardProof | null | undefined;
vi.mock("./useRewardProof.js", () => ({ useRewardProof: () => ({ data: proof }) }));
vi.mock("wagmi", () => ({ useConnection: () => ({ address: ACCOUNT }) }));

const getCumulativeClaimed = vi.fn();
const getMerkleRoot = vi.fn();
let client: SafeStakeClient | undefined;
const makeClient = () =>
  ({
    config: { chainId: 1 },
    rewards: { getCumulativeClaimed, getMerkleRoot },
  }) as unknown as SafeStakeClient;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useRewards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client = makeClient();
    proof = { cumulativeAmount: "1000", merkleRoot: ROOT, proof: [`0x${"bb".repeat(32)}`] };
    getCumulativeClaimed.mockResolvedValue(400n);
    getMerkleRoot.mockResolvedValue(ROOT);
  });

  it("derives claimable as the proof's cumulative amount minus the claimed counter", async () => {
    const { result } = renderHook(() => useRewards(), { wrapper });
    // canClaim needs the root read confirmed too, so it's the last flag to flip.
    await waitFor(() => expect(result.current.canClaim).toBe(true));
    expect(result.current.claimable).toBe(600n);
    expect(result.current.totalClaimed).toBe(400n);
    expect(result.current.rootStale).toBe(false);
  });

  it("reports nothing to claim once everything is claimed", async () => {
    getCumulativeClaimed.mockResolvedValue(1000n);
    const { result } = renderHook(() => useRewards(), { wrapper });
    await waitFor(() => expect(result.current.totalClaimed).toBe(1000n));
    expect(result.current.claimable).toBe(0n);
    expect(result.current.canClaim).toBe(false);
  });

  it("flags a stale root (claim would revert) and blocks claiming", async () => {
    getMerkleRoot.mockResolvedValue(`0x${"cc".repeat(32)}`);
    const { result } = renderHook(() => useRewards(), { wrapper });
    await waitFor(() => expect(result.current.rootStale).toBe(true));
    expect(result.current.claimable).toBe(600n);
    expect(result.current.canClaim).toBe(false);
  });

  it("blocks claiming while the root read is still pending", async () => {
    getMerkleRoot.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useRewards(), { wrapper });
    await waitFor(() => expect(result.current.claimable).toBe(600n));
    expect(result.current.rootStale).toBe(false);
    expect(result.current.canClaim).toBe(false);
  });

  it("blocks claiming when the root read fails", async () => {
    getMerkleRoot.mockRejectedValue(new Error("rpc down"));
    const { result } = renderHook(() => useRewards(), { wrapper });
    await waitFor(() => expect(result.current.claimable).toBe(600n));
    expect(result.current.rootStale).toBe(false);
    expect(result.current.canClaim).toBe(false);
  });

  it("blocks claiming while the proof has no merkle path", async () => {
    proof = { cumulativeAmount: "1000", merkleRoot: ROOT, proof: null };
    const { result } = renderHook(() => useRewards(), { wrapper });
    await waitFor(() => expect(result.current.claimable).toBe(600n));
    expect(result.current.canClaim).toBe(false);
  });

  it("reports zeros and skips the reads while there is no proof", () => {
    proof = null;
    const { result } = renderHook(() => useRewards(), { wrapper });
    expect(result.current).toEqual({
      claimable: 0n,
      totalClaimed: 0n,
      rootStale: false,
      canClaim: false,
    });
    expect(getCumulativeClaimed).not.toHaveBeenCalled();
    expect(getMerkleRoot).not.toHaveBeenCalled();
  });

  it("skips the reads on a chain without a known deployment", () => {
    client = undefined;
    const { result } = renderHook(() => useRewards(), { wrapper });
    expect(result.current.canClaim).toBe(false);
    expect(getCumulativeClaimed).not.toHaveBeenCalled();
  });
});
