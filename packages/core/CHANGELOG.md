# Changelog

All notable changes to `@chainza/safenet-staking-core` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-08-14

Initial release.

### Added

- **Typed ABIs** — `stakingAbi`, `erc20Abi`, `erc20PermitAbi`, `merkleDropAbi`,
  `sanctionsListAbi`.
- **Standalone per-method functions**, tree-shakable, grouped by contract:
  - `staking.*` — stake, initiate withdrawal, claim matured withdrawals, plus every read
    (stakes, pending withdrawals, withdraw delay, batched total validator stakes).
  - `token.*` — balance, allowance, approve, and `getTokenMeta` (name/symbol/decimals in one
    multicall).
  - `rewards.*` — cumulative MerkleDrop reads (`cumulativeClaimed`, `merkleRoot`) and `claim`.
  - `sanctions.*` — `isSanctioned` against the Chainalysis on-chain sanctions oracle.
  - Every write has an `encode*` counterpart returning calldata for Safe / EIP-5792 batching.
- **`createSafeStakeClient({ publicClient, walletClient?, config? })`** — binds client +
  config once and exposes the full surface ergonomically.
- **Config** — `resolveConfig` merges built-in known deployments (Ethereum mainnet) with
  per-chain-id and per-address overrides, checksumming all addresses.
- Dual ESM/CJS build with TypeScript declarations. `viem` is a peer dependency — the library
  never creates a client, transport, or RPC connection.

[0.1.0]: https://github.com/Chainza/safenet-staking-monorepo/tree/main/packages/core
