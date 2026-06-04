import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  // WalletConnect's dependency chain references Node globals (global/process/
  // Buffer) that the browser doesn't provide — without these the connector
  // throws during init and the connection silently fails. Any host app using
  // the widget's standalone mode + WalletConnect needs the same shim.
  plugins: [react(), tailwindcss(), nodePolyfills()],
});
