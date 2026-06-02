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

A three-layer SAFE staking stack. Each layer is an
independently publishable artifact; lower layers have no dependency on higher ones.

- **`packages/core` (`safe-stake-core`)** — headless, framework-agnostic TS library for
  staking contract interaction. **viem only** — must not gain a React, wagmi, or DOM
  dependency. This is the resilience boundary: core flows stay usable from any JS environment.
  - **Core never creates a viem client, transport, or RPC connection.** Every read takes a
    consumer-supplied `PublicClient`; every write takes a consumer-supplied connected
    `WalletClient` (`ConnectedWalletClient` = wallet client with `account` + `chain`). This is
    what lets the widget reuse the host app's client in `"inherit"` mode. Consequently `viem` is
    a **peerDependency** of core (not a regular dep), with an exact pin in `devDependencies` for
    local build/test.
  - **Three API layers:** typed ABIs (`stakingAbi` mirrors `safe-research/safenet`'s
    `contracts/src/Staking.sol` via `parseAbi`; `erc20Abi` is viem's built-in re-exported as the
    single source of truth; `erc20PermitAbi` adds the EIP-2612 surface — docs
    https://docs.safefoundation.org/, repo https://github.com/safe-research/safenet); standalone
    per-method functions grouped by contract (`staking.*` / `token.*`, covering every read/write
    on each contract plus a pure `encode*` calldata builder for Safe/EIP-5792 batching); and an
    ergonomic `createSafeStakeClient({ publicClient, walletClient?, config? })` factory that binds
    client+config once. Writes both send a tx **and** expose `encode*`. (No rewards/MerkleDrop
    module: the official repo has no such contract — reintroduce only when one ships upstream.)
  - **Chain id + addresses are dynamic and overridable.** `config` carries only `{ chainId,
addresses: { staking, token } }` (no RPC URL/transport). `resolveConfig(input?)` merges built-in
    `KNOWN_DEPLOYMENTS` (mainnet) with per-address overrides and checksums via
    `getAddress`; defaults to mainnet.
- **`packages/widget` (`safe-stake-widget`)** — React component (`<Widget />`) built
  on core. Two integration modes via the `mode` prop: `"standalone"` (manages its own wagmi
  config + connection UI) and `"inherit"` (consumes the host app's wagmi context). `react`,
  `react-dom`, `wagmi`, `viem` are **peerDependencies**; core is a `workspace:*` dependency.
  The UI is built from **vendored shadcn primitives** (`src/components/ui/*`) on Radix, so the
  widget also carries `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, and
  `lucide-react` as (exact-pinned) `dependencies`. Defaults to `theme="dark"`. State today is
  local/mock (`hooks/useStakeDemo.ts`, shaped like real core reads); wiring
  `createSafeStakeClient` is a later swap. See **Widget UI conventions** below.
- **`apps/website` (`website`)** — Vite reference app consuming the widget. Private, not published.
  - **Compliance (to add):** addresses sanctioned by OFAC, as identified through Chainalysis'
    on-chain oracle, are excluded from receiving rewards. The oracle is the `SanctionsList`
    contract at `0x40C57923924B5c5c5455c48D93317139ADDaC8fb` on Ethereum mainnet — call its
    `isSanctioned(address)` view (or `isSanctionedVerbose`) to gate reward eligibility. Not yet
    implemented — wire this into the website when the rewards flow lands.

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
  in `src/styles.css` via `@import "tailwindcss" prefix(ss);`; all widget
  utilities are `ss:`-prefixed to avoid collisions with host app styles. The widget builds CSS
  separately with `@tailwindcss/postcss` (`build:css` → `dist/styles.css`); the website uses the
  `@tailwindcss/vite` plugin instead of PostCSS.
- **Widget design tokens live in `src/theme.css`** (imported from `styles.css`): a
  **`contrast-1…9` neutral scale (1 = canvas → 9 = text)** plus semantic `success`/`error`/
  `warning`/`info` and brand `accent`/`accent-strong`/`accent-ink`. They are defined as
  `--safe-*` CSS variables on the `.safe-stake` root and mapped onto Tailwind color tokens via
  `@theme inline` (so `ss:bg-contrast-2`, `ss:text-accent-strong`, `ss:border-error` exist).
  Theme flips at runtime: `.safe-stake[data-theme="light"]` overrides the `--safe-*` vars (dark
  is the default). **Two namespaces, distinct on purpose:** `ss` is Tailwind's (utility prefix +
  its generated `--ss-*` vars); `--safe-*` / `.safe-stake` are ours — don't conflate them.
- **Styling rules (widget + website):** style only with `ss:` utilities + the tokens above —
  **never hand-author a parallel CSS system**; only genuinely un-utility-able bits (keyframes,
  pseudo-element resets, reduced-motion) belong in `theme.css`'s `@layer base`. **No gradients**
  (radial/linear/conic) unless explicitly requested — use flat fills + `/opacity` tints.
  **Even-number sizes only** (2/4/6… px; the named Tailwind scale is already even) and **no
  explicit `line-height`** (`leading-*`) unless a spot genuinely needs it (1px borders count as
  line-weight, not a size, and are fine).
- **Libraries build with tsup** (dual ESM/CJS + `.d.ts`); the app builds with Vite. The widget
  externalizes `react`, `react-dom`, `wagmi`, `viem`.
- **esbuild build script** must be approved to install cleanly — `onlyBuiltDependencies: [esbuild]`
  in `pnpm-workspace.yaml`. Package manager is pnpm (pinned via both `packageManager` and
  `devEngines`); the overlap warning between the two is harmless.
- **Package names are not final.** `safe-stake-core` / `safe-stake-widget` (and the eventual
  `@scope`) are placeholders pending npm availability and will be renamed later — don't treat
  the current names as stable.

## Widget UI conventions

- **shadcn for UI primitives.** Widget primitives are **vendored shadcn** in
  `packages/widget/src/components/ui/` (`button`, `tabs`, `input`, `select`, `card`, `badge`),
  built on Radix with `class-variance-authority` and a `cn` helper (`lib/utils.ts` =
  `clsx` + `extendTailwindMerge({ prefix: "ss" })` — the prefix matters so merges dedupe `ss:`
  classes). Icons come from `lucide-react`. Prefer composing these over hand-rolling new
  components, and **write minimal custom/boilerplate code**. The domain components
  (`AmountField`, `ValidatorSelect`, `Summary`, `Header`, panels) are thin compositions over them.
- **Token bridge:** keep `--safe-*` as the single source of truth and **alias shadcn's semantic
  tokens onto them** in `theme.css` `@theme inline` (`--color-primary: var(--safe-accent)`,
  `--color-background: var(--safe-c1)`, …). Our brand stays `accent`; shadcn's brand role is
  `primary`; shadcn's own `accent` (hover) role is replaced by `secondary` in the vendored
  components to avoid colliding with our brand `accent`.
- **Don't portal Radix content out of the widget.** Radix Select/Dialog/Popover default to a
  portal on `document.body`, which escapes the `.safe-stake` scope where the `--safe-*` vars +
  `data-theme` live → the floating content renders unthemed (e.g. transparent background).
  Render such content inline (the Select here drops `SelectPrimitive.Portal`).
- **No manual memoization.** Do not use `useMemo` / `useCallback` / `React.memo` — write plain
  computed consts and plain functions. **The React Compiler will be added later** and will handle
  memoization automatically. Where a hook must re-run every render rather than be memoized (e.g.
  reading the clock), use the **`"use no memo"`** directive — see `hooks/useDateNow.ts`
  (`{ "use no memo"; return Date.now(); }`); the directive also satisfies the `react-hooks/purity`
  lint rule that otherwise rejects `Date.now()` during render. If you genuinely need stable
  identity without memo hooks (e.g. a `useSyncExternalStore` subscribe), lift it to module scope.
- **Testing Radix:** activate Radix controls (tabs, etc.) with `@testing-library/user-event`
  (`await user.click(...)`), not `fireEvent.click` — Radix triggers respond to the focus/pointer
  sequence, which `fireEvent.click` doesn't reproduce.

## Commit conventions

- Every commit message starts with a type prefix describing what was done, e.g.
  `feat: CTA button`, `fix: …`, `chore: …`, `docs: …`, `refactor: …`, `test: …`.
- **Do not** add a `Co-authored-by: Claude` (or any Claude) trailer to commits.
- **Split work into meaningful, self-contained commits** rather than dumping everything into one.
  Group changes by concern (e.g. design tokens, vendored UI primitives, the feature UI, the
  website, docs) and commit them separately, each with its own type-prefixed message, so history
  reads as a sequence of logical steps. Avoid one giant catch-all commit.
