import { useQuery } from "@tanstack/react-query";
import { useConnection, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { assert } from "ts-essentials";
import {
  resolveConfig,
  sanctions,
  staking,
  type PendingWithdrawal,
} from "@chainza/safenet-staking-core";

const REFETCH_INTERVAL_MS = 20_000;

/** The connected account's staking position, summed across validators. */
export interface StakePosition {
  /** Staked across every validator (`totalStakerStakes`). */
  staked: bigint;
  /** Queued withdrawals still inside the unbonding delay. */
  unstaking: bigint;
  /** Queued withdrawals past the delay, ready for `claimWithdrawal()`. */
  claimable: bigint;
}

/** Sum a withdrawal queue into unstaking / claimable totals as of `nowMs`.
 *  Module-scope on purpose: React Compiler bails out of any hook containing a
 *  bigint literal. */
export function splitWithdrawals(
  withdrawals: readonly PendingWithdrawal[],
  nowMs: number,
): Pick<StakePosition, "unstaking" | "claimable"> {
  let unstaking = 0n;
  let claimable = 0n;
  for (const w of withdrawals) {
    if (Number(w.claimableAt) * 1000 <= nowMs) claimable += w.amount;
    else unstaking += w.amount;
  }
  return { unstaking, claimable };
}

/** Key for the `useStakePosition` query. `undefined` segments only occur
 *  while the query is disabled. */
export const stakePositionQueryKey = (chainId: number | undefined, staker: Address | undefined) =>
  ["safe-stake", "stake-position", chainId, staker] as const;

/**
 * The connected account's position — total staked plus the withdrawal queue
 * split into unstaking / claimable as of the read — for the header badges.
 *
 * Screened **fail-closed** like the widget: the account is checked against
 * the Chainalysis sanctions oracle first, and the position reads only run once
 * it comes back clean. A sanctioned account resolves to `null`; a failed
 * screen surfaces as a query error. Either way no position is shown.
 *
 * The widget's writes invalidate only their own queries, so this re-reads on
 * a 20s interval to follow stakes, unstakes and claims (including a Safe
 * proposal executed later).
 */
export function useStakePosition() {
  const { address } = useConnection();
  const publicClient = usePublicClient();
  const chainId = publicClient?.chain.id;

  return useQuery({
    queryKey: stakePositionQueryKey(chainId, address),
    enabled: publicClient !== undefined && address !== undefined,
    refetchInterval: REFETCH_INTERVAL_MS,
    queryFn: async (): Promise<StakePosition | null> => {
      assert(
        publicClient !== undefined && address !== undefined,
        "stake-position queryFn ran without a client or account",
      );
      const config = resolveConfig({ chainId: publicClient.chain.id });
      if (await sanctions.isSanctioned(publicClient, config, address)) return null;

      const [staked, withdrawals] = await Promise.all([
        staking.getTotalStakerStakes(publicClient, config, address),
        staking.getPendingWithdrawals(publicClient, config, address),
      ]);
      return { staked, ...splitWithdrawals(withdrawals, Date.now()) };
    },
  });
}
