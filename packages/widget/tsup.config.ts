import { readFile } from "node:fs/promises";
import { transformAsync } from "@babel/core";
import { defineConfig, type Options } from "tsup";

/**
 * React Compiler for the bundled output.
 *
 * The compiler ships as a Babel plugin and tsup bundles with esbuild, so run
 * Babel ourselves in an `onLoad` hook: parse TS/JSX, let the compiler insert the
 * memoization, and hand the still-TS/JSX source back for esbuild to transform as
 * usual. This is what lets the widget's code skip manual `useMemo` /
 * `useCallback` / `React.memo` (the website applies the same compiler to its own
 * sources via `@vitejs/plugin-react`'s `reactCompilerPreset`).
 *
 * Compiled components import `react/compiler-runtime`, hence its `external`
 * entry below — it resolves from the consumer's React 19 peer.
 */
const reactCompiler: NonNullable<Options["esbuildPlugins"]>[number] = {
  name: "react-compiler",
  setup(build) {
    build.onLoad({ filter: /\.tsx?$/ }, async ({ path }) => {
      const result = await transformAsync(await readFile(path, "utf8"), {
        filename: path,
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: ["babel-plugin-react-compiler"],
        sourceMaps: "inline",
      });
      if (result?.code == null) return undefined;
      return { contents: result.code, loader: path.endsWith("x") ? "tsx" : "ts" };
    });
  },
};

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  esbuildPlugins: [reactCompiler],
  external: [
    "react",
    "react-dom",
    "react/compiler-runtime",
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
