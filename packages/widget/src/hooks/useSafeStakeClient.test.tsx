import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Config } from "wagmi";
import { KNOWN_DEPLOYMENTS } from "safe-stake-core";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import {
  WagmiHarness,
  mainnetConfig,
  unsupportedChainConfig,
  TEST_ADDRESS,
} from "../test/wagmi.js";

const wrapper =
  (config: Config) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={config}>{children}</WagmiHarness>
  );

describe("useSafeStakeClient", () => {
  it("binds the core client to the active chain's deployment", () => {
    const { result } = renderHook(() => useSafeStakeClient(), {
      wrapper: wrapper(mainnetConfig()),
    });
    expect(result.current).toBeDefined();
    expect(result.current!.config.chainId).toBe(1);
    expect(result.current!.config.addresses).toEqual(KNOWN_DEPLOYMENTS[1]);
  });

  it("reads through the active wagmi PublicClient", async () => {
    const { result } = renderHook(() => useSafeStakeClient(), {
      wrapper: wrapper(mainnetConfig()),
    });
    // Live mainnet read — the well-known test account holds no SAFE.
    await expect(result.current!.token.getBalance(TEST_ADDRESS)).resolves.toBe(0n);
  });

  it("throws a descriptive error on writes while no wallet is connected", () => {
    const { result } = renderHook(() => useSafeStakeClient(), {
      wrapper: wrapper(mainnetConfig()),
    });
    expect(() => result.current!.staking.claimWithdrawal()).toThrow(/walletClient/);
  });

  it("returns undefined on a chain with no known SAFE deployment", () => {
    const { result } = renderHook(() => useSafeStakeClient(), {
      wrapper: wrapper(unsupportedChainConfig()),
    });
    expect(result.current).toBeUndefined();
  });
});
