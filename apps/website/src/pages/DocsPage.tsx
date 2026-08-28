import type { ReactNode } from "react";
import { LegalArticle, LegalLink, LegalSection } from "../components/LegalArticle.js";

/** Fixed-width snippet. Scrolls inside its own box so a long line can't make
 *  the page scroll sideways on mobile. */
function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-[var(--page-border)] bg-[var(--page-muted)]/5 p-4 font-mono text-xs text-[var(--page-fg)]">
      <code>{children}</code>
    </pre>
  );
}

const PROPS = [
  {
    name: "mode",
    type: '"auto" | "standalone" | "inherit"',
    fallback: '"auto"',
    description: "Wallet integration mode (below).",
  },
  {
    name: "theme",
    type: '"dark" | "light"',
    fallback: '"dark"',
    description: "Visual theme.",
  },
  {
    name: "walletConnectProjectId",
    type: "string",
    fallback: "—",
    description: "Enables the WalletConnect connector in standalone mode.",
  },
] as const;

/**
 * Developer documentation for integrators: what the three packages are, how to
 * embed the widget, how to drive the headless core, and how to verify or
 * self-host a release. Content mirrors the packages' READMEs — this page is
 * their public, always-reachable surface, shipped inside the same IPFS bundle
 * as the app it documents.
 */
export function DocsPage() {
  return (
    <LegalArticle title="Developer documentation" updated="15 August 2026" eyebrow="SAFENET · DOCS">
      <LegalSection title="The stack">
        <p>
          SAFE staking here is three independently useful layers. Each is MIT-licensed and published
          from{" "}
          <LegalLink href="https://github.com/Chainza/safenet-staking-monorepo">
            one public repository
          </LegalLink>
          .
        </p>
        <p>
          <LegalLink href="https://www.npmjs.com/package/@chainza/safenet-staking-core">
            @chainza/safenet-staking-core
          </LegalLink>{" "}
          — headless TypeScript library for the staking contracts (stake, unstake, claim
          withdrawals, claim rewards, sanctions screening). viem only: no React, no wagmi, no DOM,
          so it runs in any JavaScript environment.
        </p>
        <p>
          <LegalLink href="https://www.npmjs.com/package/@chainza/safenet-staking-widget">
            @chainza/safenet-staking-widget
          </LegalLink>{" "}
          — the whole staking flow as one React component, with live on-chain data, wallet
          connection, theming and sanctions screening built in.
        </p>
        <p>
          This site — the reference interface, embedding that widget unmodified. Anyone can host the
          same flows: embed the widget, or build your own UI on the core library.
        </p>
      </LegalSection>

      <LegalSection title="Install">
        <p>The widget shares your app's instance of each peer dependency:</p>
        <CodeBlock>
          {
            "pnpm add @chainza/safenet-staking-widget react react-dom wagmi viem @tanstack/react-query"
          }
        </CodeBlock>
      </LegalSection>

      <LegalSection title="Quick start">
        <CodeBlock>{`import { Widget } from "@chainza/safenet-staking-widget";

export function App() {
  return <Widget walletConnectProjectId="YOUR_PROJECT_ID" />;
}`}</CodeBlock>
        <p>
          That is the entire integration. Styles load themselves — the widget's JS imports its
          compiled stylesheet, and any bundler that handles CSS imports picks it up; if yours
          doesn't, import <code className="font-mono text-xs">styles.css</code> from the package
          once. Every style is scoped (Tailwind utilities prefixed{" "}
          <code className="font-mono text-xs">ss:</code>, tokens under{" "}
          <code className="font-mono text-xs">.safe-stake</code>), so nothing collides with your own
          CSS — including the reset: the widget emits no global preflight, so the host page&rsquo;s
          element styles are never touched.
        </p>
        <p>
          The widget loads no fonts of its own — no Google Fonts request, no bundled binaries. It
          renders in Bricolage Grotesque and IBM Plex Mono when the host page provides those
          families (weights 400–700 and 400/500/600 respectively) and falls back to the system
          stacks otherwise; this site self-hosts them.
        </p>
        <p>
          There are no chain or contract-address props: the deployment follows the wallet's active
          chain, and queries disable themselves on a chain with no known deployment.
        </p>
      </LegalSection>

      <LegalSection title="Props">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--page-border)] text-[var(--page-fg)]">
                <th className="py-2 pr-4 font-medium">Prop</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Default</th>
                <th className="py-2 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {PROPS.map(({ name, type, fallback, description }) => (
                <tr key={name} className="border-b border-[var(--page-border)] align-top">
                  <td className="py-2 pr-4 font-mono text-xs text-[var(--page-fg)]">{name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{type}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{fallback}</td>
                  <td className="py-2">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="Wallet modes">
        <p>
          <span className="font-mono text-xs text-[var(--page-fg)]">auto</span> (the default)
          detects a host <span className="font-mono text-xs">WagmiProvider</span> and reuses it,
          falling back to the widget's own configuration when there is none.
        </p>
        <p>
          <span className="font-mono text-xs text-[var(--page-fg)]">standalone</span> always mounts
          the widget's own wagmi config and connect UI — injected wallets, WalletConnect (when you
          pass a project id) and Safe, automatically, when the app runs inside a Safe App iframe.
        </p>
        <p>
          <span className="font-mono text-xs text-[var(--page-fg)]">inherit</span> always consumes
          the host app's wagmi context: your connect button, your connectors, no competing
          connection state.
        </p>
        <p>
          Standalone plus WalletConnect asks two things of the host bundle:{" "}
          <span className="font-mono text-xs">@walletconnect/ethereum-provider</span> installed
          (wagmi imports it lazily and does not bundle it) and Node global polyfills —{" "}
          <span className="font-mono text-xs">global</span>,{" "}
          <span className="font-mono text-xs">process</span>,{" "}
          <span className="font-mono text-xs">Buffer</span> — which WalletConnect's dependencies
          expect and browsers don't provide.
        </p>
      </LegalSection>

      <LegalSection title="Headless core">
        <p>
          Skip the UI entirely and drive the contracts yourself. The library never creates a client,
          transport or RPC connection: reads take your{" "}
          <span className="font-mono text-xs">PublicClient</span>, writes take your connected{" "}
          <span className="font-mono text-xs">WalletClient</span>, and you keep control of
          transports.
        </p>
        <CodeBlock>{`import { createPublicClient, http, parseEther } from "viem";
import { mainnet } from "viem/chains";
import { createSafeStakeClient } from "@chainza/safenet-staking-core";

const publicClient = createPublicClient({ chain: mainnet, transport: http() });
const client = createSafeStakeClient({ publicClient });

const staked = await client.staking.getStake(staker, validator);

// Writes need a connected WalletClient (account + chain):
const withWallet = createSafeStakeClient({ publicClient, walletClient });
await withWallet.staking.stake(validator, parseEther("100"));`}</CodeBlock>
        <p>
          Three layers are exported: the typed ABIs, standalone per-method functions (
          <span className="font-mono text-xs">staking.*</span>,{" "}
          <span className="font-mono text-xs">token.*</span>,{" "}
          <span className="font-mono text-xs">rewards.*</span>,{" "}
          <span className="font-mono text-xs">sanctions.*</span> — tree-shakable, each write paired
          with an <span className="font-mono text-xs">encode*</span> calldata builder for Safe and
          EIP-5792 batching), and the bound client above. Full API notes live in the{" "}
          <LegalLink href="https://github.com/Chainza/safenet-staking-monorepo/tree/main/packages/core#readme">
            core README
          </LegalLink>{" "}
          and the{" "}
          <LegalLink href="https://github.com/Chainza/safenet-staking-monorepo/tree/main/packages/widget#readme">
            widget README
          </LegalLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Compliance">
        <p>
          The widget screens the connected wallet against the Chainalysis on-chain sanctions oracle,
          fail-closed: nothing is fetched and no transaction can be sent until the screen confirms
          the wallet is not flagged. Every consumer of the widget inherits this, including this
          site. Building on the core library directly, the screen is{" "}
          <span className="font-mono text-xs">sanctions.isSanctioned</span> — enforcement is yours
          to place.
        </p>
      </LegalSection>

      <LegalSection title="Verify and self-host">
        <p>
          This interface is a static bundle on IPFS, named by ENS. Every release publishes its CID
          and the exact commands to rebuild it from the tagged source — the CID you compute must
          equal the one served. The npm tarballs are reproducible the same way, each tag recording
          the published integrity hash.
        </p>
        <p>
          Nothing about that is privileged: pin the CID and you are serving a complete, independent
          copy of this app. Release notes, verification recipes and the hosting layout are in the{" "}
          <LegalLink href="https://github.com/Chainza/safenet-staking-monorepo/blob/main/HOSTING.md">
            hosting documentation
          </LegalLink>{" "}
          and on the{" "}
          <LegalLink href="https://github.com/Chainza/safenet-staking-monorepo/releases">
            releases page
          </LegalLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Staking risks">
        <p>
          Staking SAFE carries protocol, smart-contract and beta-software risk, and staked SAFE is
          subject to an unbonding delay before it can be withdrawn. Read the Safe Foundation's{" "}
          <LegalLink href="https://docs.safefoundation.org/safenet/staking/risk">
            staking risk documentation
          </LegalLink>{" "}
          before integrating or staking.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
