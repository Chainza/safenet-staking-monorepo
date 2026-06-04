import type { ReactNode } from "react";
import { createConfig, http, WagmiProvider, type Config } from "wagmi";
import { mainnet } from "../wagmi/supportedChains.js";
import { injected, mock } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Deterministic test account for the mock connector. */
export const TEST_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
export const SECOND_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as const;

const mockConnector = (defaultConnected = false) =>
  mock({ accounts: [TEST_ADDRESS], features: { defaultConnected, reconnect: defaultConnected } });

/** Mainnet (target chain) config with a single mock connector. */
export function mainnetConfig(defaultConnected = false): Config {
  return createConfig({
    chains: [mainnet],
    connectors: [mockConnector(defaultConnected)],
    transports: { [mainnet.id]: http() },
  });
}

/** Two mock connectors — exercises the connector-picker path. */
export function twoConnectorConfig(): Config {
  return createConfig({
    chains: [mainnet],
    connectors: [
      mock({ accounts: [TEST_ADDRESS] }),
      mock({ accounts: [SECOND_ADDRESS] }),
    ],
    transports: { [mainnet.id]: http() },
  });
}

/** Real injected connector + a mock — exercises the connector label mapping. */
export function injectedPickerConfig(): Config {
  return createConfig({
    chains: [mainnet],
    connectors: [injected(), mock({ accounts: [TEST_ADDRESS] })],
    transports: { [mainnet.id]: http() },
  });
}

/** Wrap children in a wagmi + react-query provider pair for tests. */
export function WagmiHarness({ config, children }: { config: Config; children: ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
