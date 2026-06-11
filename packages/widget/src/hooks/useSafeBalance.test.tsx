import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { useSafeBalance } from "./useSafeBalance.js";
import { WagmiHarness, mainnetConfig, TEST_ADDRESS } from "../test/wagmi.js";

// Stub the client seam: what's under test here is the query itself (key,
// enabled gating, the read call). Client construction is covered by
// useSafeStakeClient.test.tsx.
const getBalance = vi.fn();
let client: SafeStakeClient | undefined;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));

function fakeClient(chainId: number, balance: () => Promise<bigint>): SafeStakeClient {
  getBalance.mockImplementation(balance);
  return { config: { chainId }, token: { getBalance } } as unknown as SafeStakeClient;
}

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

describe("useSafeBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = fakeClient(1, async () => 123n);
  });

  it("stays disabled (no read, no data) while disconnected", () => {
    const { result } = renderHook(() => useSafeBalance(), { wrapper: wrapper(false) });
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
    expect(getBalance).not.toHaveBeenCalled();
  });

  it("stays disabled when the chain has no client (unsupported deployment)", () => {
    client = undefined;
    const { result } = renderHook(() => useSafeBalance(), { wrapper: wrapper(true) });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getBalance).not.toHaveBeenCalled();
  });

  it("reads the connected account's balance through the client", async () => {
    const { result } = renderHook(() => useSafeBalance(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.data).toBe(123n));
    expect(getBalance).toHaveBeenCalledWith(TEST_ADDRESS);
  });

  it("refetches on chain switch instead of serving the previous chain's balance", async () => {
    const { result, rerender } = renderHook(() => useSafeBalance(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.data).toBe(123n));

    // The wallet moves to another supported chain → the client rebinds and the
    // query key's chain id changes, so the old cache entry no longer matches.
    client = fakeClient(10, async () => 456n);
    rerender();
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toBe(456n));
  });

  it("surfaces read failures as a query error", async () => {
    client = fakeClient(1, async () => {
      throw new Error("rpc down");
    });
    const { result } = renderHook(() => useSafeBalance(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("rpc down");
    expect(result.current.data).toBeUndefined();
  });
});
