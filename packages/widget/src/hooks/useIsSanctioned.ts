import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { useSafeStakeClientUnscreened } from "./useSafeStakeClientUnscreened.js";

/** Key for the `useIsSanctioned` query. `undefined` segments (no client/account
 *  yet) only occur while the query is disabled. */
export const isSanctionedQueryKey = (chainId: number | undefined, account: Address | undefined) =>
  ["safe-stake", "sanctioned", chainId, account] as const;

/**
 * Whether the connected account is flagged by the Chainalysis on-chain
 * sanctions oracle (OFAC) — `client.sanctions.isSanctioned`. Disabled while
 * no account is connected or the chain has no known deployment. Designations
 * change rarely, hence the hour-long staleTime. `data === true` (a confirmed
 * flag) is the condition for the blocking *notice*; the gate that holds
 * outbound calls is {@link useSanctionsCleared}, which is stricter.
 *
 * Reads through the **unscreened** client on purpose: this query is the screen
 * itself, so it must keep running while the wallet is flagged (gating it on
 * the screened `useSafeStakeClient` would un-flag the wallet the moment it
 * blocked, oscillating forever).
 */
export function useIsSanctioned() {
  const { address } = useConnection();
  const client = useSafeStakeClientUnscreened();

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

/**
 * Fail-closed screening gate: `true` once outbound calls may run — either no
 * account is connected (nothing to screen; account-scoped hooks disable
 * themselves anyway) or the oracle resolved a confirmed **not**-sanctioned for
 * the connected account. `false` while the screen is pending, failed or
 * flagged: callers hold every RPC/API call until the wallet is known clean —
 * never fetch first and screen later.
 */
export function useSanctionsCleared(): boolean {
  const { address } = useConnection();
  const { data: sanctioned } = useIsSanctioned();
  return address === undefined || sanctioned === false;
}
