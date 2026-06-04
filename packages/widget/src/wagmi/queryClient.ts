import { QueryClient } from "@tanstack/react-query";

/**
 * Lazily-created QueryClient for standalone mode. Built on first use — only when
 * the host app doesn't already provide one (see `WidgetProviders`) — and cached
 * at module scope so it survives re-renders without `useMemo`.
 */
let queryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  queryClient ??= new QueryClient();
  return queryClient;
}
