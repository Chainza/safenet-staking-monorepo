import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "@chainza/safenet-staking-core";
import { useIsSanctioned, useSanctionsCleared } from "./useIsSanctioned.js";
import { WagmiHarness, mainnetConfig, TEST_ADDRESS } from "../test/wagmi.js";

// Stub the (unscreened) client seam: what's under test here is the query
// itself (key, enabled gating, the oracle call). Client construction is
// covered by useSafeStakeClientUnscreened.test.tsx.
const isSanctioned = vi.fn();
let client: SafeStakeClient | undefined;
vi.mock("./useSafeStakeClientUnscreened.js", () => ({
  useSafeStakeClientUnscreened: () => client,
}));

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

describe("useSanctionsCleared", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = fakeClient(1, async () => false);
  });

  // Render the gate together with the screen so states can be told apart.
  const renderGate = (connected: boolean) =>
    renderHook(() => ({ cleared: useSanctionsCleared(), screen: useIsSanctioned() }), {
      wrapper: wrapper(connected),
    });

  it("clears while disconnected (nothing to screen)", () => {
    const { result } = renderGate(false);
    expect(result.current.cleared).toBe(true);
  });

  it("blocks while the screen is pending — never fetch first, screen later", async () => {
    client = fakeClient(1, () => new Promise(() => {})); // never resolves
    const { result } = renderGate(true);
    await waitFor(() => expect(result.current.screen.fetchStatus).toBe("fetching"));
    expect(result.current.cleared).toBe(false);
  });

  it("clears once the oracle confirms the account is not sanctioned", async () => {
    const { result } = renderGate(true);
    await waitFor(() => expect(result.current.cleared).toBe(true));
    expect(isSanctioned).toHaveBeenCalledWith(TEST_ADDRESS);
  });

  it("stays blocked for a flagged account", async () => {
    client = fakeClient(1, async () => true);
    const { result } = renderGate(true);
    await waitFor(() => expect(result.current.screen.data).toBe(true));
    expect(result.current.cleared).toBe(false);
  });

  it("stays blocked while the screen itself fails", async () => {
    client = fakeClient(1, async () => {
      throw new Error("rpc down");
    });
    const { result } = renderGate(true);
    await waitFor(() => expect(result.current.screen.isError).toBe(true));
    expect(result.current.cleared).toBe(false);
  });
});
