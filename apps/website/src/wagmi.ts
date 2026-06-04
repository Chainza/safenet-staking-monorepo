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
  transports: { [mainnet.id]: http() },
});

export const queryClient = new QueryClient();
