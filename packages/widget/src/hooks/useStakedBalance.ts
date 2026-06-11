import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { useSafeStakeClient } from "./useSafeStakeClient.js";

/** Key for the `useStakedBalance` query. `undefined` segments (no
 *  client/account/validator yet) only occur while the query is disabled. */
export const stakedBalanceQueryKey = (
  chainId: number | undefined,
  staker: Address | undefined,
  validator: Address | undefined,
) => ["safe-stake", "staked-balance", chainId, staker, validator] as const;

/**
 * SAFE the connected account has staked with `validator` on the active chain —
 * `client.staking.getStake`. Disabled (data stays `undefined`) while no
 * account is connected, the chain has no SAFE deployment, or the validator
 * isn't known yet (registry still loading); keyed by chain id, account and
 * validator, so switching any of them refetches instead of serving a stale
 * value.
 */
export function useStakedBalance(validator: Address | undefined) {
  const { address } = useConnection();
  const client = useSafeStakeClient();

  return useQuery({
    queryKey: stakedBalanceQueryKey(client?.config.chainId, address, validator),
    enabled: client !== undefined && address !== undefined && validator !== undefined,
    queryFn: () => {
      if (client === undefined || address === undefined || validator === undefined) {
        throw new Error("staked-balance queryFn ran without a client, account or validator");
      }
      return client.staking.getStake(address, validator);
    },
  });
}
