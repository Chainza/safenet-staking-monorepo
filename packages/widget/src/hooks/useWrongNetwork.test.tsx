import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWrongNetwork } from "./useWrongNetwork.js";

// Drive the two chain reads directly — a real harness mock connector always
// connects on the config chain, so it can't reproduce a mismatch.
let appChainId = 1;
let connection: { isConnected: boolean; chainId: number | undefined } = {
  isConnected: true,
  chainId: 1,
};
vi.mock("wagmi", () => ({
  useChainId: () => appChainId,
  useConnection: () => connection,
}));

describe("useWrongNetwork", () => {
  beforeEach(() => {
    appChainId = 1;
    connection = { isConnected: true, chainId: 1 };
  });

  it("is false when the wallet chain matches the app chain", () => {
    const { result } = renderHook(() => useWrongNetwork());
    expect(result.current).toBe(false);
  });

  it("is true when a connected wallet sits on a different chain", () => {
    connection = { isConnected: true, chainId: 137 };
    const { result } = renderHook(() => useWrongNetwork());
    expect(result.current).toBe(true);
  });

  it("is false while disconnected (no chain to mismatch)", () => {
    connection = { isConnected: false, chainId: undefined };
    const { result } = renderHook(() => useWrongNetwork());
    expect(result.current).toBe(false);
  });
});
