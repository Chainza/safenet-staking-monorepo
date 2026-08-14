import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Address } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "../lib/http.js";
import { useRewardProof, rewardProofQueryKey } from "./useRewardProof.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

let connectedAddress: Address | undefined = ACCOUNT;
vi.mock("wagmi", () => ({ useConnection: () => ({ address: connectedAddress }) }));

// Stub the sanctions gate (covered by useIsSanctioned.test.tsx) — under test
// here is only that the proof fetch waits for the screen to clear.
let cleared = true;
vi.mock("./useIsSanctioned.js", () => ({ useSanctionsCleared: () => cleared }));

// The widget's axios instance is the single HTTP seam (lib/http.test.ts covers
// the instance itself), so stub it rather than the network.
vi.mock("../lib/http.js", () => ({ http: { get: vi.fn() } }));
const getMock = vi.mocked(http.get);

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
    connectedAddress = ACCOUNT;
    cleared = true;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    getMock.mockResolvedValue({ status: 200, data: PROOF });
  });

  it("fetches the proof from the sharded registry path (lowercased address)", async () => {
    const { result } = renderHook(() => useRewardProof(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(PROOF);
    // First four address bytes shard the path: 0x70997970… → 70/99/79/70.
    expect(getMock).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/safe-fndn/safenet-beta-data/main/assets/rewards/proofs/70/99/79/70/0x70997970c51812dc3a010c7d01b50e0d17dc79c8.json",
      { validateStatus: expect.any(Function) },
    );
  });

  it("resolves null on a 404 (account has never accrued rewards)", async () => {
    getMock.mockResolvedValue({ status: 404, data: "" });
    const { result } = renderHook(() => useRewardProof(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("treats 404 (but no other failure) as a success status for axios", async () => {
    renderHook(() => useRewardProof(), { wrapper });
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    const { validateStatus } = getMock.mock.calls[0]![1]!;
    expect(validateStatus!(404)).toBe(true);
    expect(validateStatus!(200)).toBe(true);
    expect(validateStatus!(500)).toBe(false);
    expect(validateStatus!(403)).toBe(false);
  });

  it("errors on any other HTTP failure", async () => {
    getMock.mockRejectedValue(new Error("Request failed with status code 500"));
    const { result } = renderHook(() => useRewardProof(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/500/);
  });

  it("stays disabled while disconnected", () => {
    connectedAddress = undefined;
    const { result } = renderHook(() => useRewardProof(), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("stays disabled until the sanctions screen clears the wallet", () => {
    cleared = false;
    const { result } = renderHook(() => useRewardProof(), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("exposes an account-scoped query key", () => {
    expect(rewardProofQueryKey(ACCOUNT)).toEqual(["safe-stake", "reward-proof", ACCOUNT]);
  });
});
