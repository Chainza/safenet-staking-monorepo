import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      // Per-file table in the terminal; lcov for viewers.
      reporter: ["text", "lcov"],
      // Report on every source file, not just the ones a test happened to
      // import — an untested module must show as 0%, not be absent.
      include: ["src/**/*.{ts,tsx}"],
      all: true,
      // Test scaffolding, the DOM bootstrap and ambient types — nothing with
      // behavior of its own to cover.
      exclude: ["src/test/**", "src/main.tsx", "src/vite-env.d.ts"],
      // Floors, not targets: they sit at what the suite covers today so a drop
      // fails CI. Raise them when coverage improves; never lower them silently.
      thresholds: { statements: 84, branches: 76, functions: 83, lines: 87 },
    },
  },
});
