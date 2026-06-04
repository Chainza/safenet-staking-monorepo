import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App.js";
import { applyTheme, getInitialTheme } from "./theme.js";
import { queryClient, wagmiConfig } from "./wagmi.js";
import "./index.css";

// Apply the theme before first paint so there's no light/dark flash.
applyTheme(getInitialTheme());

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
