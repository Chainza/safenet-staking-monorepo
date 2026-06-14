import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient, TokenMeta } from "safe-stake-core";
import { useSafeTokenMeta, SAFE_TOKEN_META_FALLBACK } from "./useSafeTokenMeta.js";
import { WagmiHarness, mainnetConfig } from "../test/wagmi.js";

// Stub the client seam: what's under test here is the query itself (key,
// enabled gating, the multicall read + placeholder). Client construction is
// covered by useSafeStakeClient.test.tsx.
const getMeta = vi.fn();
let client: SafeStakeClient | undefined;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));

function fakeClient(chainId: number, meta: () => Promise<TokenMeta>): SafeStakeClient {
  getMeta.mockImplementation(meta);
  return { config: { chainId }, token: { getMeta } } as unknown as SafeStakeClient;
}

const META: TokenMeta = { name: "Safe Token", symbol: "SAFE", decimals: 18 };

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

describe("useSafeTokenMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = fakeClient(1, async () => META);
  });

  it("serves the SAFE fallback (initialData) when the chain has no client (unsupported)", () => {
    client = undefined;
    const { result } = renderHook(() => useSafeTokenMeta(), { wrapper: wrapper(true) });
    expect(result.current.data).toEqual(SAFE_TOKEN_META_FALLBACK);
    expect(getMeta).not.toHaveBeenCalled();
  });

  it("serves the fallback synchronously, then the real read once it resolves", async () => {
    const meta: TokenMeta = { name: "USD Coin", symbol: "USDC", decimals: 6 };
    client = fakeClient(1, async () => meta);
    // No account needed — metadata is contract-wide, so it reads while disconnected.
    const { result } = renderHook(() => useSafeTokenMeta(), { wrapper: wrapper(false) });
    expect(result.current.data).toEqual(SAFE_TOKEN_META_FALLBACK);
    // `refetchOnMount: "always"` overrides the harness's `refetchOnMount: false`,
    // so the seeded initialData is still replaced by the on-chain read.
    await waitFor(() => expect(result.current.data).toEqual(meta));
    expect(getMeta).toHaveBeenCalledTimes(1);
  });

  it("refetches on chain switch instead of serving the previous chain's metadata", async () => {
    const { result, rerender } = renderHook(() => useSafeTokenMeta(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.data.symbol).toBe("SAFE"));

    const other: TokenMeta = { name: "Other", symbol: "OTH", decimals: 8 };
    client = fakeClient(10, async () => other);
    rerender();
    await waitFor(() => expect(result.current.data).toEqual(other));
  });

  it("keeps the fallback data when the read fails, and surfaces the error", async () => {
    client = fakeClient(1, async () => {
      throw new Error("rpc down");
    });
    const { result } = renderHook(() => useSafeTokenMeta(), { wrapper: wrapper(true) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    // initialData is cached real data, so it persists through an error — `data`
    // stays defined (unlike placeholderData, which would drop to undefined).
    expect(result.current.data).toEqual(SAFE_TOKEN_META_FALLBACK);
    expect(result.current.error?.message).toBe("rpc down");
  });
});
