import type { QueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import type { WriteFlow } from "../store.js";
import { safeBalanceQueryKey } from "./useSafeBalance.js";
import { safeAllowanceQueryKey } from "./useSafeAllowance.js";
import { withdrawalsQueryKey } from "./useWithdrawals.js";
import { cumulativeClaimedQueryKey } from "./useRewards.js";
import { rewardProofQueryKey } from "./useRewardProof.js";

/**
 * Invalidate every read a write flow's tx moves, so the panels refresh. The one
 * list per flow, shared by the flow's mutation (a confirmed tx) and the Safe
 * proposal watcher (a proposal the Safe executed later).
 */
export function invalidateFlowReads(
  queryClient: QueryClient,
  flow: WriteFlow,
  chainId: number | undefined,
  account: Address | undefined,
) {
  const invalidate = (queryKey: readonly unknown[]) => queryClient.invalidateQueries({ queryKey });
  // Prefix keys match every validator's entry for the chain — a stake or
  // withdrawal moves both the account's staked balance and the validator total.
  const stakeTotals = () => {
    invalidate(["safe-stake", "staked-balance", chainId]);
    invalidate(["safe-stake", "validator-stakes", chainId]);
  };

  switch (flow) {
    case "stake":
      invalidate(safeBalanceQueryKey(chainId, account));
      invalidate(safeAllowanceQueryKey(chainId, account));
      stakeTotals();
      break;
    case "unstake":
      invalidate(withdrawalsQueryKey(chainId, account));
      stakeTotals();
      break;
    case "claim":
      invalidate(withdrawalsQueryKey(chainId, account));
      invalidate(safeBalanceQueryKey(chainId, account));
      break;
    case "rewards":
      // The proof too: a root rotation between fetch and claim would otherwise stay cached.
      invalidate(cumulativeClaimedQueryKey(chainId, account));
      invalidate(safeBalanceQueryKey(chainId, account));
      invalidate(rewardProofQueryKey(account));
      break;
  }
}
