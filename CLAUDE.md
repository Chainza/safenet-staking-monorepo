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
  on core. The `mode` prop has three values: **`"auto"` (default)** detects a host `WagmiProvider`
  and reuses it, falling back to the widget's own config when none is found; `"standalone"` always
  mounts its own; `"inherit"` always consumes the host's (and renders guidance if absent). `react`,
  `react-dom`, `wagmi`, `viem`, and `@tanstack/react-query` are **peerDependencies**; core is a
  `workspace:*` dependency. The UI is built from **vendored shadcn primitives**
  (`src/components/ui/*`) on Radix, so the widget also carries `@radix-ui/*`,
  `class-variance-authority`, `clsx`, `tailwind-merge`, and `lucide-react` as (exact-pinned)
  `dependencies`. Defaults to `theme="dark"`. Wallet **connection** is real (wagmi); the staking
  **data** (`hooks/useStakeData.ts`) is being wired to live reads field by field — the wallet
  balance (`useSafeBalance`), the staked balance (`useStakedBalance`) and the validator set
  (`useValidators`) are real; the remaining fields are still local seed values gated on the
  account. See **Wallet integration**, **On-chain data hooks** and
  **Widget UI conventions** below.
- **`apps/website` (`website`)** — Vite reference app consuming the widget. Private, not published.
  - **Compliance (to add):** addresses sanctioned by OFAC, as identified through Chainalysis'
    on-chain oracle, are excluded from receiving rewards. The oracle is the `SanctionsList`
    contract at `0x40C57923924B5c5c5455c48D93317139ADDaC8fb` on Ethereum mainnet — call its
    `isSanctioned(address)` view (or `isSanctionedVerbose`) to gate reward eligibility. Not yet
    implemented — wire this into the website when the rewards flow lands.

Dependency direction is enforced by `workspace:*` links: widget → core, website → widget.
The website imports the widget from its **built `dist/`** (via package `exports`), so the
widget must be built before the app resolves it — `turbo build` handles ordering.

**Widget HMR in the website (dev only).** Rather than running the widget's `dev --watch`
(tsup rebuild → full reload), the website's `vite.config.ts` aliases `safe-stake-widget` to
the widget's **TS source** (`packages/widget/src/index.ts`) when `command === "serve"`, so
widget edits hot-reload via React Fast Refresh with no rebuild. Production `vite build` (and
`turbo build`) drop the alias and consume the published `dist/`, keeping the real artifact
boundary intact. Two requirements make this work: (1) `resolve.dedupe` lists the shared peers
(`react`/`react-dom`/`wagmi`/`viem`/`@tanstack/react-query`) — without it the widget source
could load a second wagmi instance and miss the host's `WagmiContext`, breaking inherit-mode
detection; (2) the widget's `src/styles.css` declares `@source "./**/*.{ts,tsx}"` (relative
to itself) so Tailwind emits the `ss:` utilities regardless of whose cwd processes it — the
widget's own `build:css` _and_ the website resolving it to source.

## Wallet integration

- **Provider boundary — `src/providers/WidgetProviders.tsx`.** The widget needs wagmi +
  react-query context. It **probes the host's two contexts independently** and backfills only
  what's missing: `useContext(WagmiContext)` (from `wagmi`) for the config and
  `useContext(QueryClientContext)` (from `@tanstack/react-query`) for the QueryClient. Reads
  happen _outside_ any provider it mounts, so they observe the host. Outcomes: host has both →
  reuse both (inherit); host has neither → mount both (standalone); host has react-query but no
  wagmi → reuse its QueryClient, mount just the `WagmiProvider`. The probe is a hook called
  unconditionally — only the _rendering_ branches (no hook-rule violation). The resolved mode is
  published to the **module-global zustand store** (`src/store.ts`, `useWidgetStore`) via a
  layout-effect sync, and read by selector (`useWidgetStore(s => s.resolvedMode)`) — no
  per-value contexts, no prop-drilling. `Widget` splits into a thin outer `Widget` (mounts
  providers) + `WidgetInner` (calls wagmi hooks, always inside them).
- **Shared UI state lives in the store** (`resolvedMode`, active `tab`, `selectedValidator`) —
  read by selector, never drilled. **Transient, component-local state stays in `useState`**
  (form `amount` inputs, the connector-picker `open` flag): globalizing those would share them
  across instances and across panels. Because the store is module-global, tests must reset it
  (`useWidgetStore.setState(...)` in `beforeEach`) to avoid cross-test leakage.
- **Standalone config — `src/wagmi/standaloneConfig.ts`** is a **module-scoped singleton** cached
  by `walletConnectProjectId` (created via `getStandaloneConfig`, never in render — no `useMemo`).
  Mainnet only; connectors are `injected` + `walletConnect` (the latter only when a projectId is
  passed; otherwise injected-only with a one-time warning). `multiInjectedProviderDiscovery` is
  **off** so the connector list stays the intended two entries. **Chains come from
  `src/wagmi/supportedChains.ts`** (the single source of truth, re-exporting from `wagmi/chains`)
  — import chains from there, never directly from `wagmi/chains`. `queryClient` is likewise a
  module singleton. `react`/`react-dom`/`wagmi`/`viem`/`@tanstack/react-query` are **peer deps**
  (react-query must be the single hoisted instance shared with the active wagmi — never bundle it;
  it's in tsup `external`). The website (a standalone consumer) therefore lists react-query as a
  direct dep and passes `walletConnectProjectId` from `VITE_WALLETCONNECT_PROJECT_ID`.
- **Standalone + WalletConnect has two integrator requirements** (both satisfied in the website,
  declared as the widget's _optional_ peer):
  1. **`@walletconnect/ethereum-provider`** — `@wagmi/connectors` imports it lazily and does
     **not** bundle it (it's an optional peer there too). Without it, the WalletConnect connector
     throws on connect (`Could not resolve "@walletconnect/ethereum-provider"`).
  2. **Node global polyfills** (`global`/`process`/`Buffer`) — WalletConnect's deps reference them
     and browsers don't provide them. The website uses `vite-plugin-node-polyfills`; other
     bundlers need an equivalent. Missing them makes connect fail _silently_ (caught by the
     mutation) — `WalletControl` surfaces connect errors (console + inline message) so this
     isn't invisible. (The `@reown/appkit` build script pulled in transitively is declined via
     `allowBuilds` in `pnpm-workspace.yaml`.)
- **Connect UI — `src/components/WalletControl.tsx`** is built directly on wagmi hooks —
  **no ConnectKit or extra wallet UI lib**. Mind the **wagmi v3 deprecations**: use `useConnection`
  (not `useAccount`), and the mutation hooks' `mutate` (not the deprecated `connect`/`disconnect`
  aliases) plus `useConnectors()` (not `useConnect().connectors`). There is **no `useWalletConnection`
  wrapper** — components read `useConnection()` (and the data hook) directly. It renders only in
  standalone mode (inherit defers to the host); the connector picker and account menu render
  **inline, not portaled**, to stay inside the `.safe-stake` theme scope (same rule as the Radix
  Select).
- **Testing wagmi** uses the **`mock` connector** (`wagmi/connectors`) via the harness in
  `src/test/wagmi.tsx` (`mainnetConfig`/`twoConnectorConfig`/`unsupportedChainConfig` +
  `WagmiHarness`). `features.defaultConnected` starts a config pre-connected for state
  assertions. Files that embed JSX must be `.tsx` even for hook tests. The harness mainnet
  transports use `http(mainnetRpcUrl)` (real reads — wagmi/viem's built-in default public RPC
  is unreliable, so never bare `http()` for mainnet); hook tests needing specific values stub
  `useSafeStakeClient` instead of hitting the network.

## On-chain data hooks

- **`hooks/useSafeStakeClient.ts` is the single seam to core.** It binds the full
  `createSafeStakeClient` surface (every read/write/encode) to the **active wagmi chain**
  (`useChainId`) and the live `PublicClient`/`WalletClient` — components and data hooks never
  construct core clients or call the standalone core functions directly. The widget takes **no
  core `config` prop**: the deployment is derived from the wallet's chain via
  `KNOWN_DEPLOYMENTS`, so a chain switch rebinds the client (and refetches) instead of showing
  the previous chain's data. On a chain with no known deployment the hook returns `undefined`
  and every dependent query must disable itself (`enabled`).
- **Query keys come from a builder function — never inline.** Every `useQuery`/`useMutation`
  hook gets a dedicated key constructor **exported from the same file as the hook**, named by
  convention `useSomeData` → `someDataQueryKey` (e.g. `useSafeBalance` →
  `safeBalanceQueryKey`). Keys are namespaced under `"safe-stake"` and include the chain id
  (+ account where relevant) so they're collision-free in host apps and chain/account switches
  miss the old cache.
- **Per-field hooks compose `useStakeData`.** Each on-chain field gets its own
  query hook (`useSafeBalance` → `client.token.getBalance`, …) that `useStakeData` aggregates
  for the panels; replace the remaining seed fields by adding hooks of the same shape.
- **The validator set is hybrid (`hooks/useValidators.ts`).** The contract has no validator
  enumeration, so the _set_ comes from the official registry JSON
  (`safe-fndn/safenet-beta-data` → `assets/validator-info.json`, linked from
  docs.safefoundation.org; filtered to `is_active`, checksummed, hour-long `staleTime`) and
  the _stake totals_ come on-chain (`staking.getTotalValidatorStakes`, one batched query for
  the whole set). `validators` is `[]` (and `selectedValidator` `undefined`) while the
  registry loads — `ValidatorSelect` renders a loading placeholder and `useStakedBalance`
  stays disabled until a validator is known.
- **QueryClient defaults are tuned for on-chain reads** (widget standalone client, mirrored by
  the website's host client and the test harness): `refetchOnMount: false` and
  `refetchOnWindowFocus: false` (refresh via invalidation — e.g. after a tx — not remount/focus),
  `staleTime: 30s` (~2 blocks), queries `retry: 2` (harness: `false`), mutations
  `retry: false` (never auto-retry a write — it may have broadcast despite the error). These
  only govern standalone mode; in inherit mode the host's QueryClient defaults apply.

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
  `wagmi`/`viem`/`@tanstack/react-query`), which stay as ranges so consumers aren't forced onto a
  single version.
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
- **Logging:** use `lib/logger.ts` (`logger.log`/`info`/`warn`/`error`) instead of `console.*` in
  the widget — it prefixes every line with `[safe-stake-widget]`, so callers never repeat it.
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
