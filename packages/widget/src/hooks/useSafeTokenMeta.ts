import { useQuery } from "@tanstack/react-query";
import type { TokenMeta } from "safe-stake-core";
import { useSafeStakeClient } from "./useSafeStakeClient.js";

/** Key for the `useSafeTokenMeta` query. The `undefined` chain segment only
 *  occurs while the query is disabled (no client yet). */
export const safeTokenMetaQueryKey = (chainId: number | undefined) =>
  ["safe-stake", "token-meta", chainId] as const;

/** Mainnet SAFE metadata, seeded as `initialData` so `data` is always defined —
 *  the UI never renders a blank symbol or mis-scales an amount while the read is
 *  disabled, in flight, on error, or on an unsupported chain. */
export const SAFE_TOKEN_META_FALLBACK: TokenMeta = {
  name: "Safe Token",
  symbol: "SAFE",
  decimals: 18,
};

/**
 * Token name/symbol/decimals for the active chain, fetched in a single
 * multicall (`client.token.getMeta`). Metadata is a contract-wide,
 * account-independent constant, so this reads even while disconnected and is
 * keyed by chain id alone. Returns the full `useQuery` result (like the sibling
 * read hooks) with `data` typed non-nullable, because {@link
 * SAFE_TOKEN_META_FALLBACK} is seeded as `initialData` (cached real data, so it
 * survives an error too — unlike `placeholderData`).
 *
 * The seed is stamped `initialDataUpdatedAt: 0` so it always reads as stale, and
 * the query opts into `refetchOnMount: "always"` to override the widget's global
 * `refetchOnMount: false`. Together they guarantee the real metadata is read on
 * mount and re-read when the chain (query key) changes, rather than the seed
 * being pinned in cache.
 */
export function useSafeTokenMeta() {
  const client = useSafeStakeClient();

  return useQuery({
    queryKey: safeTokenMetaQueryKey(client?.config.chainId),
    enabled: client !== undefined,
    initialData: SAFE_TOKEN_META_FALLBACK,
    initialDataUpdatedAt: 0,
    refetchOnMount: "always",
    queryFn: () => {
      if (client === undefined) {
        throw new Error("token-meta queryFn ran without a client");
      }
      return client.token.getMeta();
    },
  });
}
