import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { useSafeStakeClient } from "./useSafeStakeClient.js";

/** Key for the `useWithdrawals` query. `undefined` segments (no client/account
 *  yet) only occur while the query is disabled. */
export const withdrawalsQueryKey = (chainId: number | undefined, staker: Address | undefined) =>
  ["safe-stake", "withdrawals", chainId, staker] as const;

/**
 * Withdrawal-queue entries for the connected account on the active chain —
 * `client.staking.getPendingWithdrawals`. Disabled (data stays `undefined`)
 * while no account is connected or the chain has no SAFE deployment; keyed by
 * chain id and account so switching either refetches rather than serving a
 * stale queue.
 */
export function useWithdrawals() {
  const { address } = useConnection();
  const client = useSafeStakeClient();

  return useQuery({
    queryKey: withdrawalsQueryKey(client?.config.chainId, address),
    enabled: client !== undefined && address !== undefined,
    queryFn: () => {
      if (client === undefined || address === undefined) {
        throw new Error("withdrawals queryFn ran without a client or account");
      }
      return client.staking.getPendingWithdrawals(address);
    },
  });
}
