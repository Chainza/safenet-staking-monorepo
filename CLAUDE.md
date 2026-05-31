# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root and fan out across workspaces via Turborepo.

- `pnpm build` — build all packages in dependency order (core → widget → website).
- `pnpm dev` — run all `dev` tasks (tsup `--watch` for libs, Vite dev server for the app).
- `pnpm typecheck` — `tsc --noEmit` across all workspaces.
- `pnpm lint` — ESLint across all workspaces.
- `pnpm test` — Vitest (`vitest run`) across packages.
- `pnpm format` / `pnpm format:check` — Prettier write / check.

Scope to one workspace with `--filter`:

- `pnpm --filter website dev` — boot only the Vite app.
- `pnpm --filter safe-stake-core test` — test one package.
- Run a single test file: `pnpm --filter safe-stake-widget exec vitest run src/Widget.test.tsx`.
- Watch one package's tests: `pnpm --filter safe-stake-core exec vitest`.

## Architecture

A three-layer SAFE staking stack (see `PROPOSAL.md` for full intent). Each layer is an
independently publishable artifact; lower layers have no dependency on higher ones.

- **`packages/core` (`safe-stake-core`)** — headless, framework-agnostic TS library for
  staking contract interaction. **viem only** — must not gain a React, wagmi, or DOM
  dependency. This is the resilience boundary: core flows stay usable from any JS environment.
- **`packages/widget` (`safe-stake-widget`)** — React component (`<Widget />`) built
  on core. Two integration modes via the `mode` prop: `"standalone"` (manages its own wagmi
  config + connection UI) and `"inherit"` (consumes the host app's wagmi context). `react`,
  `react-dom`, `wagmi`, `viem` are **peerDependencies**; core is a `workspace:*` dependency.
- **`apps/website` (`website`)** — Vite reference app consuming the widget. Private, not published.

Dependency direction is enforced by `workspace:*` links: widget → core, website → widget.
The website imports the widget from its **built `dist/`** (via package `exports`), so the
widget must be built before the app resolves it — `turbo build` handles ordering; in dev,
keep the widget's `dev --watch` running alongside the website.

## Testing expectations

Cover with tests everything that makes sense to test:

- **`safe-stake-core`** — every exported function (and the public behavior of exported types/clients).
- **`safe-stake-widget`** — every component and every hook (plus any exported utilities).
- **`website`** — every component and every hook (plus any non-trivial app logic).

Tests live next to source (`*.test.ts` / `*.test.tsx`). The widget/app use `jsdom` +
`@testing-library/react`; core tests run in the default Node environment.

## Conventions that bite

- **Bleeding-edge majors are intentional**: TypeScript 6, Vite 8, React 19, Tailwind 4,
  ESLint 10, Vitest 4. Prefer the latest major for new deps; resolve peer conflicts forward
  rather than downgrading.
- **Exact version pins**: every `dependencies` / `devDependencies` entry is pinned to an
  exact version (no `^`/`~`). When adding a dep, install the specific version and write the
  bare number. The **one exception is `peerDependencies`** (the widget's `react`/`react-dom`/
  `wagmi`/`viem`), which stay as ranges so consumers aren't forced onto a single version.
- **TS 6**: `baseUrl` is deprecated, so `tsconfig.base.json` sets `"ignoreDeprecations": "6.0"`
  (tsup injects `baseUrl` during d.ts builds). Strict mode + `noUncheckedIndexedAccess` are on.
- **ESM-first**: root `package.json` is `type: module`; intra-package relative imports use
  explicit `.js` extensions (e.g. `import { X } from "./X.js"`) even from `.ts`/`.tsx` source.
- **Tailwind v4 is CSS-first** — there is no `tailwind.config`. The widget configures Tailwind
  in `src/styles.css` via `@import "tailwindcss" prefix(ss);` + an `@theme {}` block; all widget
  utilities are `ss:`-prefixed to avoid collisions with host app styles. The widget builds CSS
  separately with `@tailwindcss/postcss` (`build:css` → `dist/styles.css`); the website uses the
  `@tailwindcss/vite` plugin instead of PostCSS.
- **Libraries build with tsup** (dual ESM/CJS + `.d.ts`); the app builds with Vite. The widget
  externalizes `react`, `react-dom`, `wagmi`, `viem`.
- **esbuild build script** must be approved to install cleanly — `onlyBuiltDependencies: [esbuild]`
  in `pnpm-workspace.yaml`. Package manager is pnpm (pinned via both `packageManager` and
  `devEngines`); the overlap warning between the two is harmless.
- **Package names are not final.** `safe-stake-core` / `safe-stake-widget` (and the eventual
  `@scope`) are placeholders pending npm availability and will be renamed later — don't treat
  the current names as stable.

## Commit conventions

- Every commit message starts with a type prefix describing what was done, e.g.
  `feat: CTA button`, `fix: …`, `chore: …`, `docs: …`, `refactor: …`, `test: …`.
- **Do not** add a `Co-authored-by: Claude` (or any Claude) trailer to commits.
