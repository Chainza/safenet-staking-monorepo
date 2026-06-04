import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useStakeData } from "./useStakeData.js";
import { useWidgetStore } from "../store.js";

describe("useStakeData", () => {
  // The store is module-global; reset validator selection between cases.
  beforeEach(() => useWidgetStore.setState({ selectedValidator: null }));

  it("zeroes balances and withdrawals when disconnected", () => {
    const { result } = renderHook(() => useStakeData(false));
    expect(result.current.walletBalance).toBe(0n);
    expect(result.current.stakedBalance).toBe(0n);
    expect(result.current.withdrawals).toHaveLength(0);
    // Validators are always listed (they don't depend on the connection).
    expect(result.current.validators.length).toBeGreaterThan(0);
  });

  it("populates balances and withdrawals when connected", () => {
    const { result } = renderHook(() => useStakeData(true));
    expect(result.current.walletBalance).toBeGreaterThan(0n);
    expect(result.current.stakedBalance).toBeGreaterThan(0n);
    expect(result.current.withdrawals.length).toBeGreaterThan(0);
  });

  it("selectValidator() switches the active validator", () => {
    const { result } = renderHook(() => useStakeData(true));
    const second = result.current.validators[1]!;
    act(() => result.current.selectValidator(second.address));
    expect(result.current.selectedValidator.address).toBe(second.address);
  });

  it("exposes exactly one matured (claimable) withdrawal when connected", () => {
    const { result } = renderHook(() => useStakeData(true));
    const nowSec = BigInt(Math.floor(Date.now() / 1000));
    const matured = result.current.withdrawals.filter((w) => w.claimableAt <= nowSec);
    expect(matured).toHaveLength(1);
  });
});
