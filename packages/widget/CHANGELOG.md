# Changelog

All notable changes to `@chainza/safenet-staking-widget` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-08-28

Milestone-review fixes. `0.1.0` is deprecated on npm: it shipped the official Safe
logo as the token icon, which the grant agreement does not license.

### Changed

- **Original token glyph** — the icon shown for SAFE amounts is now our own
  ascending-bars mark; no Safe brand assets remain in the package.
- **No bundled fonts** — the stylesheet no longer `@import`s Google Fonts (a library
  must not phone home on the consumer's behalf). The intended families (Bricolage
  Grotesque, IBM Plex Mono) apply when the host page provides them and fall back to
  system stacks otherwise; see the README's new **Fonts** section.
- **Preflight is scoped** — the widget no longer emits Tailwind's global preflight, so
  it never resets the host page's element styles; the reset subset the widget needs is
  scoped under `.safe-stake`. The README's isolation claim now holds verbatim.
- **Higher-contrast buttons** — disabled buttons keep full-contrast text on a muted
  fill instead of an opacity wash; the active tab and accent text meet ≥4.5:1 on the
  light theme (`--safe-accent-strong` darkened).

### Fixed

- **Write flows fail when a tx mines but reverts** — all four flows (stake incl. its
  approval, unstake, claim withdrawal, claim rewards) now check `receipt.status` and
  reject on `"reverted"` instead of reporting success.
- **Reward proofs are validated** — the registry's proof JSON is checked at the trust
  boundary (decimal amounts, 32-byte hex root/path); a malformed file becomes a query
  error instead of a render crash or a doomed transaction.
- **`canClaim` requires a confirmed root** — the rewards claim button stays disabled
  while the on-chain `merkleRoot()` read is pending or failed, not only on a confirmed
  mismatch.
- **Error boundary around the panels** — a render crash degrades to an inline notice
  instead of unmounting the host app's tree.
- **Amount inputs reject negative values** — the sign/exponent keys are blocked, values
  pasted or dropped with a `-` are ignored (`min="0"` floors the native control), and
  `parseAmount` clamps anything negative to `0n`.

## [0.1.0] — 2026-08-14

Initial release.

### Added

- **`<Widget />`** with four flows: stake (auto-approve when allowance is short), unstake
  (withdrawal queue), claim matured withdrawals, and claim MerkleDrop staking rewards.
- **Live on-chain data** — wallet balance, staked balance per validator, validator set with
  total stakes (official Safenet registry + batched on-chain reads), withdrawal queue,
  unbonding delay, token metadata; all react-query backed with collision-free
  `"safe-stake"`-namespaced keys.
- **Three wallet modes** via the `mode` prop: `auto` (default — detects and reuses a host
  `WagmiProvider`, falls back to its own), `standalone` (own wagmi config + connect UI:
  injected, WalletConnect, and Safe App connectors), `inherit` (always consumes the host's).
- **Theming** — `theme="dark" | "light"`, design tokens as CSS variables scoped under
  `.safe-stake`; all Tailwind utilities `ss:`-prefixed so styles can't collide with the host
  app. The compiled stylesheet is imported by the widget's JS (bundlers include it
  automatically) and also exported as `./styles.css`.
- **Sanctions screening, fail-closed** — the connected wallet is screened against the
  Chainalysis on-chain sanctions oracle before any data is fetched or transaction sent;
  flagged wallets get a blocking notice.
- **Chain awareness** — no config props; the deployment derives from the wallet's active
  chain, and queries disable themselves on chains without a known deployment.
- Dual ESM/CJS build with TypeScript declarations. `react`, `react-dom`, `wagmi`, `viem` and
  `@tanstack/react-query` are peer dependencies.

[0.1.0]: https://github.com/Chainza/safenet-staking-monorepo/tree/main/packages/widget
