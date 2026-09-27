import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import type { WriteFlow } from "../store.js";
import { invalidateFlowReads } from "./invalidateFlowReads.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

function invalidatedKeys(flow: WriteFlow) {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  invalidateFlowReads(queryClient, flow, 1, ACCOUNT);
  return invalidate.mock.calls.map((c) => c[0]?.queryKey);
}

describe("invalidateFlowReads", () => {
  it("stake: wallet balance, allowance and every stake total", () => {
    expect(invalidatedKeys("stake")).toEqual([
      ["safe-stake", "balance", 1, ACCOUNT],
      ["safe-stake", "allowance", 1, ACCOUNT],
      ["safe-stake", "staked-balance", 1],
      ["safe-stake", "validator-stakes", 1],
    ]);
  });

  it("unstake: the withdrawal queue and every stake total", () => {
    expect(invalidatedKeys("unstake")).toEqual([
      ["safe-stake", "withdrawals", 1, ACCOUNT],
      ["safe-stake", "staked-balance", 1],
      ["safe-stake", "validator-stakes", 1],
    ]);
  });

  it("claim: the withdrawal queue and wallet balance", () => {
    expect(invalidatedKeys("claim")).toEqual([
      ["safe-stake", "withdrawals", 1, ACCOUNT],
      ["safe-stake", "balance", 1, ACCOUNT],
    ]);
  });

  it("rewards: the claimed counter, wallet balance and the proof", () => {
    expect(invalidatedKeys("rewards")).toEqual([
      ["safe-stake", "cumulative-claimed", 1, ACCOUNT],
      ["safe-stake", "balance", 1, ACCOUNT],
      ["safe-stake", "reward-proof", ACCOUNT],
    ]);
  });
});
