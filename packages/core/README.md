# @chainza/safenet-staking-core

Headless TypeScript library for [Safenet](https://docs.safefoundation.org/) SAFE staking —
stake, unstake, claim withdrawals, claim rewards, sanctions screening. **viem only**: no
React, no wagmi, no DOM. Usable from any JavaScript environment — React, Vue, Svelte, Node
scripts, or vanilla browser code.

Part of the [SAFE Staking Stack](https://github.com/Chainza/safenet-staking-monorepo)
(core → [widget](https://www.npmjs.com/package/@chainza/safenet-staking-widget) → reference
UI at [safenetstake.eth.limo](https://safenetstake.eth.limo)).

## Install

```sh
pnpm add @chainza/safenet-staking-core viem
```

`viem` is a peer dependency — the library never creates a client, transport, or RPC
connection. Every read takes your `PublicClient`; every write takes your connected
`WalletClient`. You keep full control of transports, and the library works with whatever
client your app already has.

## Quick start

```ts
import { createPublicClient, http, parseEther } from "viem";
import { mainnet } from "viem/chains";
import { createSafeStakeClient } from "@chainza/safenet-staking-core";

const publicClient = createPublicClient({ chain: mainnet, transport: http() });

// Defaults to the mainnet deployment; walletClient is optional (reads only).
const client = createSafeStakeClient({ publicClient });

const staked = await client.staking.getStake(staker, validator);
const balance = await client.token.getBalance(staker);

// Writes need a connected WalletClient (account + chain):
const withWallet = createSafeStakeClient({ publicClient, walletClient });
await withWallet.token.approve(parseEther("100")); // spender defaults to the staking contract
await withWallet.staking.stake(validator, parseEther("100"));
```

## Three API layers

1. **Typed ABIs** — `stakingAbi`, `erc20Abi`, `erc20PermitAbi`, `merkleDropAbi`,
   `sanctionsListAbi`; use them directly with viem if you want zero abstraction.
2. **Standalone per-method functions** — `staking.*`, `token.*`, `rewards.*`, `sanctions.*`;
   tree-shakable, each takes `(client, config, …args)`. Every write has an `encode*`
   counterpart returning calldata for Safe / EIP-5792 batching.
3. **`createSafeStakeClient({ publicClient, walletClient?, config? })`** — binds client +
   config once and exposes the full surface ergonomically.

## Configuration

`config` carries only `{ chainId, addresses: { staking, token, merkleDrop, sanctionsList } }`.
`resolveConfig(input?)` merges the built-in known deployments (Ethereum mainnet) with
per-address overrides and checksums everything — omit it entirely for mainnet defaults.

## Notes

- **Rewards** are a cumulative MerkleDrop: one proof per published root covers all rounds;
  `claim` transfers `cumulativeAmount − cumulativeClaimed(account)` and reverts if the root
  rotated (refetch the proof then).
- **Sanctions screening** (`sanctions.isSanctioned`) reads the Chainalysis on-chain sanctions
  oracle; UI-level enforcement is up to the consumer (the widget ships it fail-closed).
- Dual ESM/CJS with TypeScript declarations.

## License

[MIT](./LICENSE) © Chainza
