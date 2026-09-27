import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useConnectionScopedMutation } from "./useConnectionScopedMutation.js";

const ACCOUNT_A = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
const ACCOUNT_B = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as const;

// The connection is driven by these two values; the mutation itself stays real.
let address: string | undefined;
let chainId: number;
vi.mock("wagmi", () => ({
  useConnection: () => ({ address }),
  useChainId: () => chainId,
}));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

function renderSettled() {
  const hook = renderHook(() => useConnectionScopedMutation({ mutationFn: async () => "queued" }), {
    wrapper,
  });
  act(() => hook.result.current.mutate());
  return hook;
}

describe("useConnectionScopedMutation", () => {
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    address = ACCOUNT_A;
    chainId = 1;
  });

  it("keeps the outcome while the account and chain stay the same", async () => {
    const { result, rerender } = renderSettled();
    await waitFor(() => expect(result.current.data).toBe("queued"));

    rerender();
    expect(result.current.data).toBe("queued");
  });

  it("clears the outcome when the account changes", async () => {
    const { result, rerender } = renderSettled();
    await waitFor(() => expect(result.current.data).toBe("queued"));

    address = ACCOUNT_B;
    rerender();
    await waitFor(() => expect(result.current.isIdle).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it("clears the outcome when the chain changes", async () => {
    const { result, rerender } = renderSettled();
    await waitFor(() => expect(result.current.data).toBe("queued"));

    chainId = 11_155_111;
    rerender();
    await waitFor(() => expect(result.current.isIdle).toBe(true));
  });

  it("clears a failure the same way", async () => {
    const { result, rerender } = renderHook(
      () =>
        useConnectionScopedMutation({
          mutationFn: async () => {
            throw new Error("boom");
          },
        }),
      { wrapper },
    );
    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isError).toBe(true));

    address = undefined;
    rerender();
    await waitFor(() => expect(result.current.error).toBeNull());
  });
});
