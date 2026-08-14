# Changelog

All notable changes to `@chainza/safenet-staking-widget` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
