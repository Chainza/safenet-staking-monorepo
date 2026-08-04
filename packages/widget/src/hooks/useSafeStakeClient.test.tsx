import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import { WagmiHarness, mainnetConfig } from "../test/wagmi.js";

// Stub the screening gate: client construction is covered by
// useSafeStakeClientUnscreened.test.tsx, the gate's own truth table by
// useIsSanctioned.test.tsx — under test here is only the composition.
let cleared = true;
vi.mock("./useIsSanctioned.js", () => ({ useSanctionsCleared: () => cleared }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <WagmiHarness config={mainnetConfig()}>{children}</WagmiHarness>
);

describe("useSafeStakeClient", () => {
  beforeEach(() => {
    cleared = true;
  });

  it("passes the client through once the sanctions screen has cleared", () => {
    const { result } = renderHook(() => useSafeStakeClient(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current!.config.chainId).toBe(1);
  });

  it("returns undefined until the screen clears (pending, failed or flagged)", () => {
    cleared = false;
    const { result } = renderHook(() => useSafeStakeClient(), { wrapper });
    expect(result.current).toBeUndefined();
  });
});
