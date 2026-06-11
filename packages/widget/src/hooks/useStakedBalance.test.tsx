import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { useStakedBalance } from "./useStakedBalance.js";
import { WagmiHarness, mainnetConfig, TEST_ADDRESS, SECOND_ADDRESS } from "../test/wagmi.js";

// Stub the client seam: what's under test here is the query itself (key,
// enabled gating, the read call). Client construction is covered by
// useSafeStakeClient.test.tsx.
const getStake = vi.fn();
let client: SafeStakeClient | undefined;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));

function fakeClient(chainId: number, stake: () => Promise<bigint>): SafeStakeClient {
  getStake.mockImplementation(stake);
  return { config: { chainId }, staking: { getStake } } as unknown as SafeStakeClient;
}

const VALIDATOR = "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326" as const;

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

describe("useStakedBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = fakeClient(1, async () => 123n);
  });

  it("stays disabled (no read, no data) while disconnected", () => {
    const { result } = renderHook(() => useStakedBalance(VALIDATOR), {
      wrapper: wrapper(false),
    });
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
    expect(getStake).not.toHaveBeenCalled();
  });

  it("stays disabled when the chain has no client (unsupported deployment)", () => {
    client = undefined;
    const { result } = renderHook(() => useStakedBalance(VALIDATOR), {
      wrapper: wrapper(true),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getStake).not.toHaveBeenCalled();
  });

  it("reads the connected account's stake with the validator through the client", async () => {
    const { result } = renderHook(() => useStakedBalance(VALIDATOR), {
      wrapper: wrapper(true),
    });
    await waitFor(() => expect(result.current.data).toBe(123n));
    expect(getStake).toHaveBeenCalledWith(TEST_ADDRESS, VALIDATOR);
  });

  it("refetches on validator switch instead of serving the previous validator's stake", async () => {
    const { result, rerender } = renderHook(({ validator }) => useStakedBalance(validator), {
      wrapper: wrapper(true),
      initialProps: { validator: VALIDATOR as `0x${string}` },
    });
    await waitFor(() => expect(result.current.data).toBe(123n));

    // A different validator changes the query key → the old cache entry no
    // longer matches and the stake is re-read for the new validator.
    getStake.mockImplementation(async () => 456n);
    rerender({ validator: SECOND_ADDRESS });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toBe(456n));
    expect(getStake).toHaveBeenLastCalledWith(TEST_ADDRESS, SECOND_ADDRESS);
  });

  it("refetches on chain switch instead of serving the previous chain's stake", async () => {
    const { result, rerender } = renderHook(() => useStakedBalance(VALIDATOR), {
      wrapper: wrapper(true),
    });
    await waitFor(() => expect(result.current.data).toBe(123n));

    client = fakeClient(10, async () => 456n);
    rerender();
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toBe(456n));
  });

  it("surfaces read failures as a query error", async () => {
    client = fakeClient(1, async () => {
      throw new Error("rpc down");
    });
    const { result } = renderHook(() => useStakedBalance(VALIDATOR), {
      wrapper: wrapper(true),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("rpc down");
    expect(result.current.data).toBeUndefined();
  });
});
