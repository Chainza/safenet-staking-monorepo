import { useQuery } from "@tanstack/react-query";
import { useSafeStakeClient } from "./useSafeStakeClient.js";

/** Key for the `useWithdrawDelay` query. The `undefined` chain segment only
 *  occurs while the query is disabled (no client yet). */
export const withdrawDelayQueryKey = (chainId: number | undefined) =>
  ["safe-stake", "withdraw-delay", chainId] as const;

/**
 * Unbonding delay (seconds) between initiating and claiming a withdrawal on the
 * active chain — `client.staking.getWithdrawDelay`. A contract-wide parameter,
 * so it needs no account; disabled (data stays `undefined`) only while the
 * chain has no SAFE deployment. Keyed by chain id so a chain switch refetches.
 */
export function useWithdrawDelay() {
  const client = useSafeStakeClient();

  return useQuery({
    queryKey: withdrawDelayQueryKey(client?.config.chainId),
    enabled: client !== undefined,
    queryFn: () => {
      if (client === undefined) {
        throw new Error("withdraw-delay queryFn ran without a client");
      }
      return client.staking.getWithdrawDelay();
    },
  });
}
