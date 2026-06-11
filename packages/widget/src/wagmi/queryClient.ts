import { QueryClient } from "@tanstack/react-query";

/**
 * Lazily-created QueryClient for standalone mode. Built on first use — only when
 * the host app doesn't already provide one (see `WidgetProviders`) — and cached
 * at module scope so it survives re-renders without `useMemo`.
 *
 * Defaults are tuned for on-chain reads (note they only govern standalone mode;
 * in inherit mode the host's QueryClient and its defaults apply):
 * - `refetchOnMount: false` — remounts (tab switches, widget re-mounts) serve
 *   cache instead of re-firing every RPC read.
 * - `refetchOnWindowFocus: false` — focus changes shouldn't spam the RPC;
 *   on-chain values are refreshed by invalidation (e.g. after a tx), not focus.
 * - `staleTime: 30s` (~2 blocks) — values can't change faster than the chain.
 * - queries `retry: 2` — tolerate a transient RPC hiccup, then surface the error.
 * - mutations `retry: false` — never auto-retry a write: a "failed" send may
 *   still have broadcast, and a retry could double-submit the transaction.
 */
let queryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  queryClient ??= new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        retry: 2,
      },
      mutations: { retry: false },
    },
  });
  return queryClient;
}
