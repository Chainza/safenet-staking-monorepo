# @chainza/safenet-staking-widget

Drop-in React widget for [Safenet](https://docs.safefoundation.org/) SAFE staking — stake,
unstake, claim withdrawals and claim rewards, with live on-chain data, wallet connection,
theming and built-in sanctions screening. Built on
[`@chainza/safenet-staking-core`](https://www.npmjs.com/package/@chainza/safenet-staking-core).

See it live at [safenetstake.eth.limo](https://safenetstake.eth.limo) (the
[reference UI](https://github.com/Chainza/safenet-staking-monorepo) embedding this widget).

## Install

```sh
pnpm add @chainza/safenet-staking-widget react react-dom wagmi viem @tanstack/react-query
```

`react`, `react-dom`, `wagmi`, `viem` and `@tanstack/react-query` are peer dependencies —
the widget shares your app's single instance of each.

## Usage

```tsx
import { Widget } from "@chainza/safenet-staking-widget";

export function App() {
  return <Widget walletConnectProjectId="YOUR_WALLETCONNECT_PROJECT_ID" />;
}
```

Styles load automatically: the widget's JS imports its compiled stylesheet, and any bundler
that processes CSS imports (Vite, Next.js, …) includes it. If your toolchain doesn't, import
it explicitly once: `import "@chainza/safenet-staking-widget/styles.css";`. All styles are
scoped (Tailwind utilities prefixed `ss:`, design tokens under the `.safe-stake` class) so
they can't collide with your app's CSS.

### Fonts

The widget loads no fonts of its own — no Google Fonts request, no bundled font binaries. It
renders in **Bricolage Grotesque** (display) and **IBM Plex Mono** (figures, labels,
addresses) when the host page provides those families, and falls back to the system UI and
monospace stacks otherwise. To get the intended look, self-host the two families and declare
them with `@font-face` (weights: Bricolage Grotesque 400–700, IBM Plex Mono 400/500/600), or
serve them however your app already serves fonts.

## Props

| Prop                     | Type                                  | Default  |                                                        |
| ------------------------ | ------------------------------------- | -------- | ------------------------------------------------------ |
| `mode`                   | `"auto" \| "standalone" \| "inherit"` | `"auto"` | Wallet integration mode (below)                        |
| `theme`                  | `"dark" \| "light"`                   | `"dark"` | Visual theme                                           |
| `walletConnectProjectId` | `string`                              | —        | Enables the WalletConnect connector in standalone mode |

### Wallet modes

- **`auto`** (default) — detects a host `WagmiProvider` and reuses it; falls back to the
  widget's own config when none is found.
- **`standalone`** — the widget mounts its own wagmi config and wallet-connection UI.
  Connectors: injected, WalletConnect (when `walletConnectProjectId` is set), and Safe
  (automatically, when running inside a Safe App iframe).
- **`inherit`** — always consumes the host app's wagmi context (your connect button, your
  connectors); renders guidance if there is none.

The widget needs no chain/config props: the deployment is derived from the wallet's active
chain, and queries disable themselves on chains without a known deployment.

### Standalone + WalletConnect

Two extra integrator requirements (both optional peers):

1. `@walletconnect/ethereum-provider` — wagmi's connector imports it lazily and does not
   bundle it.
2. Node global polyfills (`global` / `process` / `Buffer`) — e.g.
   `vite-plugin-node-polyfills` for Vite; WalletConnect's dependencies expect them.

For Safe App support in your own wagmi config (inherit mode inside Safe{Wallet}), add
`@safe-global/safe-apps-sdk` + `@safe-global/safe-apps-provider` the same way.

## Compliance

The widget screens the connected wallet against the Chainalysis on-chain sanctions oracle,
fail-closed: no data is fetched and no transaction can be sent until the screen confirms the
wallet is not flagged; flagged wallets get a blocking notice.

## License

[MIT](./LICENSE) © Chainza
