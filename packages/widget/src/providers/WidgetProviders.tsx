import { useContext, useLayoutEffect, type ReactNode } from "react";
import { WagmiContext, WagmiProvider } from "wagmi";
import { QueryClientContext, QueryClientProvider } from "@tanstack/react-query";
import type { WidgetMode } from "../Widget.js";
import { getStandaloneConfig } from "../wagmi/standaloneConfig.js";
import { getQueryClient } from "../wagmi/queryClient.js";
import { useWidgetStore } from "../store.js";

export interface WidgetProvidersProps {
  mode: WidgetMode;
  walletConnectProjectId?: string;
  children: ReactNode;
}

/**
 * Sets up the wagmi + react-query context the widget needs, reusing whatever
 * the host already provides and backfilling only what's missing:
 *
 * - host has a `WagmiProvider`  → reuse its config (inherit)
 * - host has a `QueryClientProvider` → reuse its QueryClient
 * - neither → mount our own (standalone)
 *
 * The two probes are independent, so a host with react-query but no wagmi gets
 * its QueryClient reused while we add just the WagmiProvider. Context reads
 * happen outside any provider we mount, so they observe the host's contexts.
 * The resolved mode is published to the widget store (read via selectors, not
 * drilled); the layout effect syncs it before paint so there's no flash.
 */
export function WidgetProviders({ mode, walletConnectProjectId, children }: WidgetProvidersProps) {
  const hostConfig = useContext(WagmiContext);
  const hostQueryClient = useContext(QueryClientContext);
  const setResolvedMode = useWidgetStore((s) => s.setResolvedMode);

  const inheritWagmi = mode === "inherit" || (mode === "auto" && hostConfig !== undefined);
  const resolvedMode = inheritWagmi ? "inherit" : "standalone";
  const missingHost = mode === "inherit" && hostConfig === undefined;

  useLayoutEffect(() => {
    setResolvedMode(resolvedMode);
  }, [resolvedMode, setResolvedMode]);

  if (missingHost) {
    return (
      <div className="safe-stake ss:text-sm ss:text-destructive">
        safe-stake-widget: mode="inherit" requires the host app to provide a WagmiProvider.
      </div>
    );
  }

  // Build inside-out so the resulting nesting is the conventional
  // WagmiProvider > QueryClientProvider > children when both are backfilled.
  let tree = <>{children}</>;

  if (hostQueryClient === undefined) {
    tree = <QueryClientProvider client={getQueryClient()}>{tree}</QueryClientProvider>;
  }

  if (!inheritWagmi) {
    tree = (
      <WagmiProvider config={getStandaloneConfig(walletConnectProjectId)}>{tree}</WagmiProvider>
    );
  }

  return tree;
}
