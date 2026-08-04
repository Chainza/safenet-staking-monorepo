import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { useIsSanctioned } from "./useIsSanctioned.js";
import { WagmiHarness, mainnetConfig, TEST_ADDRESS } from "../test/wagmi.js";

// Stub the client seam: what's under test here is the query itself (key,
// enabled gating, the oracle call). Client construction is covered by
// useSafeStakeClient.test.tsx.
const isSanctioned = vi.fn();
let client: SafeStakeClient | undefined;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));

function fakeClient(chainId: number, sanctioned: () => Promise<boolean>): SafeStakeClient {
  isSanctioned.mockImplementation(sanctioned);
  return { config: { chainId }, sanctions: { isSanctioned } } as unknown as SafeStakeClient;
}

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

describe("useIsSanctioned", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = fakeClient(1, async () => false);
  });

  it("stays disabled (no read, no data) while disconnected", () => {
    const { result } = renderHook(() => useIsSanctioned(), { wrapper: wrapper(false) });
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
    expect(isSanctioned).not.toHaveBeenCalled();
  });

  it("stays disabled when the chain has no client (unsupported deployment)", () => {
    client = undefined;
    const { result } = renderHook(() => useIsSanctioned(), { wrapper: wrapper(true) });
    expect(result.current.fetchStatus).toBe("idle");
    expect(isSanctioned).not.toHaveBeenCalled();
  });

  it("screens the connected account through the oracle", async () => {
    const { result } = renderHook(() => useIsSanctioned(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.data).toBe(false));
    expect(isSanctioned).toHaveBeenCalledWith(TEST_ADDRESS);
  });

  it("surfaces a flagged account as true", async () => {
    client = fakeClient(1, async () => true);
    const { result } = renderHook(() => useIsSanctioned(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.data).toBe(true));
  });

  it("surfaces oracle read failures as a query error, not a flag", async () => {
    client = fakeClient(1, async () => {
      throw new Error("rpc down");
    });
    const { result } = renderHook(() => useIsSanctioned(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("rpc down");
    expect(result.current.data).toBeUndefined();
  });
});
