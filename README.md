# SAFE Staking Stack

A permissionless, non-custodial SAFE staking stack, structured as three layered, independently
useful artifacts:

- **`packages/core`** (`safe-stake-core`) — a headless TypeScript library handling all staking
  contract interaction (stake, unstake, claim) using **viem** directly. Framework-agnostic, no
  React or wagmi dependency — usable from any JavaScript environment.
- **`packages/widget`** (`safe-stake-widget`) — a React `<Widget />` built on the core
  library. Supports **standalone** mode (manages its own wagmi config + wallet connection UI)
  and **inherit** mode (consumes the host app's existing wagmi context). Themeable, styled with
  Tailwind (prefixed to avoid collisions with host styles).
- **`apps/website`** — the reference staking UI (Vite) consuming the widget.

## Prerequisites

- **Node 22** (see [`.nvmrc`](.nvmrc))
- **pnpm 11** (`corepack enable` or install per [pnpm.io](https://pnpm.io))

## Getting started

```bash
pnpm install        # install + link workspaces
pnpm dev            # run all dev tasks (lib watchers + website dev server)
```

Run just the reference app:

```bash
pnpm --filter website dev
```

## Commands

All run from the repo root and fan out across workspaces via Turborepo:

| Command          | Description                                  |
| ---------------- | -------------------------------------------- |
| `pnpm build`     | Build all packages (core → widget → website) |
| `pnpm dev`       | Run all dev tasks (watch mode)               |
| `pnpm test`      | Run Vitest across packages                   |
| `pnpm typecheck` | `tsc --noEmit` across workspaces             |
| `pnpm lint`      | ESLint across workspaces                     |
| `pnpm format`    | Prettier write (`format:check` to verify)    |

## Contributing

See [`CLAUDE.md`](CLAUDE.md) for repo conventions (version pinning, Tailwind v4 setup,
ESM import rules, testing expectations, and other gotchas).

## License

[MIT](LICENSE) © Chainza
