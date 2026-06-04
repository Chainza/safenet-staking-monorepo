import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    "wagmi",
    "wagmi/chains",
    "wagmi/connectors",
    "viem",
    "@tanstack/react-query",
  ],
  // Keep `import "./styles.css"` as an external runtime import. esbuild can't
  // process the Tailwind v4 stylesheet, and we ship the compiled CSS separately
  // (see build:css below), so the JS bundle should reference it, not inline it.
  esbuildOptions(options) {
    options.external = [...(options.external ?? []), "*.css"];
  },
  // tsup doesn't process Tailwind; emit dist/styles.css via postcss after every
  // build. This runs on initial build AND on each rebuild in --watch (dev) mode,
  // so `dist/styles.css` (the package's "./styles.css" export) always exists.
  onSuccess: "pnpm run build:css",
});
