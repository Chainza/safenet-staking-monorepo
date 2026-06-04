import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ command }) => ({
  // WalletConnect's dependency chain references Node globals (global/process/
  // Buffer) that the browser doesn't provide — without these the connector
  // throws during init and the connection silently fails. Any host app using
  // the widget's standalone mode + WalletConnect needs the same shim.
  plugins: [react(), tailwindcss(), nodePolyfills()],
  resolve: {
    // Dev only: resolve the widget to its TS source so edits hot-reload via
    // React Fast Refresh without a `tsup` rebuild. Production `vite build` (and
    // `turbo build`) keep consuming the published `dist/` via package exports,
    // so the shipped artifact is what gets built and tested. Exact match (regex)
    // so the bare specifier maps to source while leaving any subpath alone.
    alias:
      command === "serve"
        ? [
            {
              find: /^safe-stake-widget$/,
              // Absolute path to the widget's TS source entry (resolved relative to this file
              // so it's independent of the cwd). Uses the `URL` global rather than `node:url`
              // so the config typechecks without pulling in `@types/node`.
              replacement: new URL("../../packages/widget/src/index.ts", import.meta.url).pathname,
            },
          ]
        : [],
    // Peer libs that MUST be a single instance shared between the app and the widget
    // source. Without deduping, the widget could pull its own copy of wagmi and its
    // `useContext(WagmiContext)` would miss the app's provider — breaking the
    // widget's host-detection (inherit) entirely.
    dedupe: ["react", "react-dom", "wagmi", "viem", "@tanstack/react-query"],
  },
}));
