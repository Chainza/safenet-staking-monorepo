import { Link } from "react-router";
import { LegalArticle, LegalLink, LegalSection } from "../components/LegalArticle.js";

/** Same look as LegalLink, for the in-app links (routed, so no new tab). */
const internalLinkClass =
  "font-medium text-[var(--page-fg)] underline decoration-[var(--page-border)] underline-offset-4 transition-colors hover:decoration-[var(--page-accent)]";

/**
 * FAQ — one section per question, hosted on the site itself (next to the
 * imprint, terms and privacy policy) rather than only linking out to Safe's
 * own FAQ. Protocol facts (unbonding, slashing, the 75% participation rule)
 * mirror the official Safenet docs and the widget's risk disclosure — keep the
 * three in sync.
 */
export function FaqPage() {
  return (
    <LegalArticle
      title="Frequently Asked Questions"
      updated="28 August 2026"
      eyebrow="SAFENET · FAQ"
    >
      <LegalSection title="What is Safenet staking?">
        <p>
          Staking SAFE delegates your tokens to a Safenet Beta validator through the Safenet staking
          smart contracts on Ethereum mainnet. Your stake backs the validator&rsquo;s work in the
          network and accrues staking rewards. The protocol, the contracts and the SAFE token are
          developed and published by the Safe Ecosystem Foundation and its contributors; this site
          is an independent, non-custodial interface to them operated by Chainza (see the{" "}
          <Link to="/imprint" className={internalLinkClass}>
            Imprint
          </Link>
          ).
        </p>
      </LegalSection>

      <LegalSection title="Is this interface custodial?">
        <p>
          No. Every transaction is signed by your own wallet and sent from your own address —
          Chainza never holds your tokens, your keys or any withdrawal rights, does not operate
          validators, and is not a counterparty to any staking transaction. The entire interface is
          open source under the MIT license:{" "}
          <LegalLink href="https://github.com/Chainza/safenet-staking-monorepo">
            github.com/Chainza/safenet-staking-monorepo
          </LegalLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="How do I stake?">
        <p>
          Connect a wallet, pick a validator, enter an amount and confirm. If the staking contract
          isn&rsquo;t yet approved to move that amount of SAFE, the interface first asks for a
          standard ERC-20 approval transaction and then sends the stake itself — two wallet
          confirmations the first time, one afterwards.
        </p>
      </LegalSection>

      <LegalSection title="How do I unstake, and when do I get my tokens back?">
        <p>
          Unstaking is a two-step flow. Initiating a withdrawal moves your stake out of the
          validator and into a withdrawal queue, where it sits for the protocol&rsquo;s unbonding
          delay (shown live in the widget, read from the contract). Once the delay has passed, the
          claim tab releases the matured withdrawal back to your wallet. Unstaked tokens earn no
          rewards while queued.
        </p>
      </LegalSection>

      <LegalSection title="How do rewards work?">
        <p>
          Rewards are distributed through a cumulative merkle drop: each published distribution
          commits to your lifetime reward total, and a single claim transfers everything still
          outstanding — you can claim at any pace without losing anything. The rewards tab shows
          your claimable amount once a distribution includes your address. Some rewards can be
          withheld pending the Safe Ecosystem Foundation&rsquo;s compliance (KYC) checks; the
          rewards tab says so when that applies, and such checks are handled by the Foundation (
          <LegalLink href="mailto:legal@safefoundation.org">legal@safefoundation.org</LegalLink>),
          not by Chainza.
        </p>
      </LegalSection>

      <LegalSection title="What are the risks?">
        <p>
          There is no slashing in Safenet Beta — staked SAFE cannot be confiscated or destroyed. If
          your validator&rsquo;s participation falls below 75% in a reward period, that
          period&rsquo;s rewards are forfeited (your stake is unaffected). And as with any on-chain
          protocol — particularly one in Beta — smart-contract risk remains. The full disclosure
          lives in the official{" "}
          <LegalLink href="https://docs.safefoundation.org/safenet/staking/risk">
            Safenet staking risk documentation
          </LegalLink>{" "}
          and is repeated inside the widget itself.
        </p>
      </LegalSection>

      <LegalSection title="What does it cost?">
        <p>
          The interface adds no fees of its own. You pay Ethereum gas for each transaction, and each
          validator charges the fee on rewards shown next to it in the validator picker.
        </p>
      </LegalSection>

      <LegalSection title="Which wallets can I use?">
        <p>
          Any injected browser wallet (MetaMask and the like), any WalletConnect-compatible wallet,
          and Safe{"{"}Wallet{"}"} when the interface runs as a Safe App.
        </p>
      </LegalSection>

      <LegalSection title="Why is my wallet blocked?">
        <p>
          The interface screens every connected wallet against the Chainalysis on-chain sanctions
          oracle — a public registry of sanctioned addresses. A flagged wallet sees a notice instead
          of the staking panels and no data is fetched on its behalf. This screening is a compliance
          requirement and cannot be disabled.
        </p>
      </LegalSection>

      <LegalSection title="Can I verify or self-host the interface?">
        <p>
          Yes. The canonical deployment is content-addressed on IPFS behind the{" "}
          <LegalLink href="https://safenetstake.eth.limo/">safenetstake.eth</LegalLink> ENS name,
          the packages are published on npm, and every release can be reproduced from source. The{" "}
          <Link to="/docs" className={internalLinkClass}>
            Developers
          </Link>{" "}
          page walks through verifying a release and embedding the widget in your own app.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
