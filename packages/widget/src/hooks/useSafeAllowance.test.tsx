import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { useSafeAllowance } from "./useSafeAllowance.js";
import { WagmiHarness, mainnetConfig, TEST_ADDRESS } from "../test/wagmi.js";

// Stub the client seam: what's under test is the query itself (key, enabled
// gating, the read call). Client construction is covered elsewhere.
const getAllowance = vi.fn();
let client: SafeStakeClient | undefined;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));

function fakeClient(chainId: number, allowance: () => Promise<bigint>): SafeStakeClient {
  getAllowance.mockImplementation(allowance);
  return { config: { chainId }, token: { getAllowance } } as unknown as SafeStakeClient;
}

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

describe("useSafeAllowance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = fakeClient(1, async () => 1000n);
  });

  it("stays disabled (no read, no data) while disconnected", () => {
    const { result } = renderHook(() => useSafeAllowance(), { wrapper: wrapper(false) });
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
    expect(getAllowance).not.toHaveBeenCalled();
  });

  it("stays disabled when the chain has no client (unsupported deployment)", () => {
    client = undefined;
    const { result } = renderHook(() => useSafeAllowance(), { wrapper: wrapper(true) });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getAllowance).not.toHaveBeenCalled();
  });

  it("reads the connected account's allowance (spender defaults to staking)", async () => {
    const { result } = renderHook(() => useSafeAllowance(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.data).toBe(1000n));
    expect(getAllowance).toHaveBeenCalledWith(TEST_ADDRESS);
  });

  it("refetches on chain switch instead of serving the previous chain's allowance", async () => {
    const { result, rerender } = renderHook(() => useSafeAllowance(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.data).toBe(1000n));

    client = fakeClient(10, async () => 42n);
    rerender();
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toBe(42n));
  });
});
