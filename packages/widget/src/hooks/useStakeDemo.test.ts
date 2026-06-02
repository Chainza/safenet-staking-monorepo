import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useStakeDemo } from "./useStakeDemo.js";

describe("useStakeDemo", () => {
  it("starts disconnected with zeroed balances", () => {
    const { result } = renderHook(() => useStakeDemo());
    expect(result.current.connected).toBe(false);
    expect(result.current.account).toBeNull();
    expect(result.current.walletBalance).toBe(0n);
    expect(result.current.withdrawals).toHaveLength(0);
  });

  it("connect() populates account, balances and withdrawals", () => {
    const { result } = renderHook(() => useStakeDemo());
    act(() => result.current.connect());

    expect(result.current.connected).toBe(true);
    expect(result.current.account).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(result.current.walletBalance).toBeGreaterThan(0n);
    expect(result.current.stakedBalance).toBeGreaterThan(0n);
    expect(result.current.withdrawals.length).toBeGreaterThan(0);
  });

  it("disconnect() clears the connected state", () => {
    const { result } = renderHook(() => useStakeDemo());
    act(() => result.current.connect());
    act(() => result.current.disconnect());
    expect(result.current.connected).toBe(false);
    expect(result.current.account).toBeNull();
  });

  it("selectValidator() switches the active validator", () => {
    const { result } = renderHook(() => useStakeDemo());
    const second = result.current.validators[1]!;
    act(() => result.current.selectValidator(second.address));
    expect(result.current.selectedValidator.address).toBe(second.address);
  });

  it("exposes exactly one matured (claimable) withdrawal when connected", () => {
    const { result } = renderHook(() => useStakeDemo());
    act(() => result.current.connect());
    const nowSec = BigInt(Math.floor(Date.now() / 1000));
    const matured = result.current.withdrawals.filter((w) => w.claimableAt <= nowSec);
    expect(matured).toHaveLength(1);
  });
});
