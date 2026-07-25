import { useState, type ReactNode } from "react";
import { createConfig, http, WagmiProvider, type Config } from "wagmi";
import { mainnet } from "wagmi/chains";
import { mock } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Deterministic test account for the mock connector. */
export const TEST_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

/** Mainnet config with a single mock connector (trimmed from the widget's
 *  test harness). `defaultConnected` starts it pre-connected. */
export function mainnetConfig(defaultConnected = false): Config {
  return createConfig({
    chains: [mainnet],
    connectors: [
      mock({
        accounts: [TEST_ADDRESS],
        features: { defaultConnected, reconnect: defaultConnected },
      }),
    ],
    transports: { [mainnet.id]: http("https://eth.blockrazor.xyz") },
  });
}

/** Wrap children in a wagmi + react-query provider pair for tests. Mirrors the
 *  app's QueryClient defaults except queries never retry, so failures surface
 *  immediately. Per-mount (fresh cache per test), stable across re-renders. */
export function WagmiHarness({ config, children }: { config: Config; children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
