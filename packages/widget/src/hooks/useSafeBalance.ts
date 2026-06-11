import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { useSafeStakeClient } from "./useSafeStakeClient.js";

/** Key for the `useSafeBalance` query. `undefined` segments (no client/account
 *  yet) only occur while the query is disabled. */
export const safeBalanceQueryKey = (chainId: number | undefined, owner: Address | undefined) =>
  ["safe-stake", "balance", chainId, owner] as const;

/**
 * Wallet SAFE balance of the connected account on the active chain —
 * `client.token.getBalance`. Disabled (data stays `undefined`) while no
 * account is connected or the chain has no SAFE deployment; keyed by chain id
 * so a chain switch refetches rather than showing the previous chain's value.
 */
export function useSafeBalance() {
  const { address } = useConnection();
  const client = useSafeStakeClient();

  return useQuery({
    queryKey: safeBalanceQueryKey(client?.config.chainId, address),
    enabled: client !== undefined && address !== undefined,
    queryFn: () => {
      if (client === undefined || address === undefined) {
        throw new Error("balance queryFn ran without a client or account");
      }
      return client.token.getBalance(address);
    },
  });
}
