import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      // Per-file table in the terminal; lcov for viewers.
      reporter: ["text", "lcov"],
      // Report on every source file, not just the ones a test happened to
      // import — an untested module must show as 0%, not be absent.
      include: ["src/**/*.ts"],
      all: true,
      // Floors, not targets: they sit at what the suite covers today so a drop
      // fails CI. Raise them when coverage improves; never lower them silently.
      // Everything here is at 100% except `client.ts` — the bound
      // `createSafeStakeClient` surface is what holds the numbers down.
      thresholds: { statements: 70, branches: 100, functions: 65, lines: 70 },
    },
  },
});
