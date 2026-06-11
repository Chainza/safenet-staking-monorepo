import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

/**
 * The website's own wagmi config. Kept deliberately simple and aligned with the
 * widget's standalone config: mainnet-only, `injected` plus `walletConnect`
 * (when a projectId is supplied), EIP-6963 multi-injected discovery off so the
 * connector list stays the intended entries.
 *
 * Mounting this at the app root lets the widget (in its default `auto` mode)
 * detect a host `WagmiProvider` and reuse it — no widget-owned wagmi needed.
 */
const connectors = walletConnectProjectId
  ? [injected(), walletConnect({ projectId: walletConnectProjectId })]
  : [injected()];

export const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors,
  multiInjectedProviderDiscovery: false,
  transports: { [mainnet.id]: http("https://eth.blockrazor.xyz") },
});

// Mirrors the widget's standalone QueryClient defaults (see the widget's
// wagmi/queryClient.ts for the per-option rationale): serve cache on
// remount/focus, ~2-block staleTime, bounded read retries, never retry writes.
export const queryClient = new QueryClient({
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
