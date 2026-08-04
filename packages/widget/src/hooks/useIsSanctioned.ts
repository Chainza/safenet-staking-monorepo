import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { useSafeStakeClient } from "./useSafeStakeClient.js";

/** Key for the `useIsSanctioned` query. `undefined` segments (no client/account
 *  yet) only occur while the query is disabled. */
export const isSanctionedQueryKey = (chainId: number | undefined, account: Address | undefined) =>
  ["safe-stake", "sanctioned", chainId, account] as const;

/**
 * Whether the connected account is flagged by the Chainalysis on-chain
 * sanctions oracle (OFAC) — `client.sanctions.isSanctioned`. Disabled while
 * no account is connected or the chain has no known deployment. Designations
 * change rarely, hence the hour-long staleTime. Consumers must only block on a
 * confirmed `true` (`data === true`) — a pending or failed read is not a flag.
 */
export function useIsSanctioned() {
  const { address } = useConnection();
  const client = useSafeStakeClient();

  return useQuery({
    queryKey: isSanctionedQueryKey(client?.config.chainId, address),
    enabled: client !== undefined && address !== undefined,
    staleTime: 3_600_000,
    queryFn: () => {
      if (client === undefined || address === undefined) {
        throw new Error("sanctioned queryFn ran without a client or account");
      }
      return client.sanctions.isSanctioned(address);
    },
  });
}
