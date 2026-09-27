# Changelog

All notable changes to `@chainza/safenet-staking-widget` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-09-27

Safe support: writes from a Safe account now settle instead of hanging on a
`safeTxHash` no RPC can resolve.

### Added

- **"Queued in your Safe" notice** — every panel shows a notice while a write it proposed
  to a Safe is waiting to execute (confirm and execute it in Safe{Wallet}); it clears and
  the balances refresh once the Safe executes it, or turns into a failure notice if the
  Safe tx fails or is cancelled. While one is pending the claim and rewards buttons show
  "Queued in Safe" and stay disabled so the same claim can't be proposed twice — across
  tab switches too.

### Fixed

- **Writes from a Safe account hung and then failed** — when the widget runs as a Safe
  App, or a Safe is connected from Safe{Wallet} over WalletConnect, `eth_sendTransaction`
  returns a `safeTxHash`, and the flows used to wait for its receipt until viem's 180s
  timeout, then report failure for a tx that was queued or already executed. Writes
  from a Safe account are now sent as one EIP-5792 `wallet_sendCalls` batch (so stake's
  approve + stake is a single Safe tx) and end as _proposed_ right away; the widget then
  waits on the Safe's `wallet_getCallsStatus` (wagmi's `useWaitForCallsStatus`, no timeout)
  until it executes — seconds for a 1-of-1, whenever the owners execute a multisig — and
  refreshes the balances. A tx that was queued is never reported as failed.
- **Safe detection is by account, not connector** — a Safe connected over WalletConnect
  is recognized (the account has code and a non-zero `getThreshold()`), and a failing
  check aborts before anything is sent rather than guessing.
- **Stale outcomes across accounts** — a write's result (a queued-Safe notice, a failure
  alert) is cleared when the connected account or chain changes, so it never shows for
  the next account.

### Known limits

- A pending Safe proposal is watched while the widget is open; a page reload forgets it
  (the reload refetches the balances anyway).
- Over WalletConnect, the Safe{Wallet} tab must stay open for the status checks to be
  answered; the widget keeps retrying until it is.

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
