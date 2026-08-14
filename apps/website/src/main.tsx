import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router";
import { assert } from "ts-essentials";
import App from "./App.js";
import { applyTheme, getInitialTheme } from "./theme.js";
import { queryClient, wagmiConfig } from "./wagmi.js";
import "./index.css";

// Apply the theme before first paint so there's no light/dark flash.
applyTheme(getInitialTheme());

const rootElement = document.getElementById("root");
assert(rootElement, "Root element #root not found");

createRoot(rootElement).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* Hash routing (/#/imprint), not history routing: the production host is
            IPFS gateways, which serve static files with no SPA rewrites — a deep
            link like /imprint would 404 there. Only "/" is ever requested. */}
        <HashRouter>
          <App />
        </HashRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
