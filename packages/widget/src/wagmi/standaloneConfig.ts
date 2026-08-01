import { createConfig, http, type Config } from "wagmi";
import { mainnet, mainnetRpcUrl } from "./supportedChains.js";
import { injected, safe, walletConnect } from "wagmi/connectors";
import { isIframe } from "../lib/isIframe.js";
import { isTruthy } from "../lib/isTruthy.js";
import { logger } from "../lib/logger.js";

/**
 * The widget's own wagmi config, used only when no host `WagmiProvider` is
 * detected (standalone mode). Mainnet-only; connectors are `injected`, plus
 * `walletConnect` (only when a projectId is supplied) and `safe` (only when
 * embedded in an iframe — the Safe App context — since outside one the
 * connector can never produce a provider and would be a dead picker entry).
 *
 * EIP-6963 multi-injected discovery is disabled so the connector list stays
 * the intended entries rather than fanning out into one entry per detected
 * browser wallet.
 */
const cache = new Map<string, Config>();
let warnedMissingProjectId = false;

export function getStandaloneConfig(walletConnectProjectId?: string): Config {
  const key = walletConnectProjectId ?? "";
  const cached = cache.get(key);
  if (cached) return cached;

  if (!walletConnectProjectId && !warnedMissingProjectId) {
    warnedMissingProjectId = true;
    logger.warn(
      "No walletConnectProjectId provided — standalone mode will offer the injected " +
        "connector only. Pass `walletConnectProjectId` to enable WalletConnect.",
    );
  }

  const connectors = [
    injected(),
    walletConnectProjectId ? walletConnect({ projectId: walletConnectProjectId }) : undefined,
    isIframe() ? safe() : undefined,
  ].filter(isTruthy);

  const config = createConfig({
    chains: [mainnet],
    connectors,
    multiInjectedProviderDiscovery: false,
    transports: { [mainnet.id]: http(mainnetRpcUrl) },
  });
  cache.set(key, config);
  return config;
}
