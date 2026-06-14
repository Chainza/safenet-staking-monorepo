import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { useWithdrawDelay } from "./useWithdrawDelay.js";
import { WagmiHarness, mainnetConfig } from "../test/wagmi.js";

// Stub the client seam: what's under test here is the query itself (key,
// enabled gating, the read call). Client construction is covered by
// useSafeStakeClient.test.tsx.
const getWithdrawDelay = vi.fn();
let client: SafeStakeClient | undefined;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));

function fakeClient(chainId: number, delay: () => Promise<bigint>): SafeStakeClient {
  getWithdrawDelay.mockImplementation(delay);
  return { config: { chainId }, staking: { getWithdrawDelay } } as unknown as SafeStakeClient;
}

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

describe("useWithdrawDelay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = fakeClient(1, async () => 604_800n);
  });

  it("stays disabled when the chain has no client (unsupported deployment)", () => {
    client = undefined;
    const { result } = renderHook(() => useWithdrawDelay(), { wrapper: wrapper(true) });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getWithdrawDelay).not.toHaveBeenCalled();
  });

  it("reads the contract-wide delay without needing an account (works disconnected)", async () => {
    const { result } = renderHook(() => useWithdrawDelay(), { wrapper: wrapper(false) });
    await waitFor(() => expect(result.current.data).toBe(604_800n));
    expect(getWithdrawDelay).toHaveBeenCalled();
  });

  it("refetches on chain switch instead of serving the previous chain's delay", async () => {
    const { result, rerender } = renderHook(() => useWithdrawDelay(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.data).toBe(604_800n));

    client = fakeClient(10, async () => 1_209_600n);
    rerender();
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toBe(1_209_600n));
  });

  it("surfaces read failures as a query error", async () => {
    client = fakeClient(1, async () => {
      throw new Error("rpc down");
    });
    const { result } = renderHook(() => useWithdrawDelay(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("rpc down");
    expect(result.current.data).toBeUndefined();
  });
});
