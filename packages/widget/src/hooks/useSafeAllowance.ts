import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { useSafeStakeClient } from "./useSafeStakeClient.js";

/** Key for the `useSafeAllowance` query. `undefined` segments (no client/account
 *  yet) only occur while the query is disabled. */
export const safeAllowanceQueryKey = (chainId: number | undefined, owner: Address | undefined) =>
  ["safe-stake", "allowance", chainId, owner] as const;

/**
 * SAFE the connected account has approved the staking contract to spend on the
 * active chain — `client.token.getAllowance` (spender defaults to staking).
 * Drives the stake flow's approve-vs-stake decision (`stake` takes no permit
 * signature, so a short allowance means a separate `approve` tx first). Disabled
 * (data stays `undefined`) while no account is connected or the chain has no
 * SAFE deployment; keyed by chain id + account so a switch refetches rather than
 * serving a stale allowance.
 */
export function useSafeAllowance() {
  const { address } = useConnection();
  const client = useSafeStakeClient();

  return useQuery({
    queryKey: safeAllowanceQueryKey(client?.config.chainId, address),
    enabled: client !== undefined && address !== undefined,
    queryFn: () => {
      if (client === undefined || address === undefined) {
        throw new Error("allowance queryFn ran without a client or account");
      }
      return client.token.getAllowance(address);
    },
  });
}
