import { Link } from "react-router";
import { LegalArticle, LegalLink, LegalSection } from "../components/LegalArticle.js";

const RISKS_DOCS_URL = "https://docs.safefoundation.org/safenet/staking/risk";

/** Terms of service for the interface. Operator facts live in the Imprint. */
export function TermsPage() {
  return (
    <LegalArticle title="Terms of Service" updated="4 August 2026">
      <LegalSection title="1. About these terms">
        <p>
          These terms govern your use of this website and the SAFE staking interface it hosts
          (the &ldquo;Interface&rdquo;), operated by LIMITED LIABILITY COMPANY &ldquo;CHAINZA&rdquo;
          (&ldquo;Chainza&rdquo;, &ldquo;we&rdquo;) — see the{" "}
          <Link to="/imprint" className="font-medium text-[var(--page-fg)] underline decoration-[var(--page-border)] underline-offset-4">
            Imprint
          </Link>{" "}
          for the operator&rsquo;s identity. By accessing or using the Interface you accept these
          terms; if you do not agree with them, do not use the Interface.
        </p>
      </LegalSection>

      <LegalSection title="2. The Interface">
        <p>
          The Interface is a non-custodial web application that lets you interact with the
          Safenet Beta staking smart contracts on Ethereum mainnet: staking SAFE with a
          validator, initiating and claiming withdrawals, and claiming staking rewards. It runs
          entirely in your browser.
        </p>
        <p>
          The Safenet protocol, the staking and rewards contracts and the SAFE token are
          developed and published by the Safe Ecosystem Foundation and its contributors. Chainza
          did not develop and does not control those contracts, does not operate validators, and
          is not a party to any transaction you submit. Your keys and your tokens never leave
          your control: every transaction is composed locally and signed by your own wallet.
        </p>
      </LegalSection>

      <LegalSection title="3. No advice, no brokerage">
        <p>
          Nothing on the Interface constitutes investment, financial, legal or tax advice, an
          offer, or a solicitation. Chainza does not broker transactions, execute them on your
          behalf, or receive your assets at any point. You use the Interface at your own
          initiative and are responsible for your own decisions.
        </p>
      </LegalSection>

      <LegalSection title="4. Eligibility and sanctions compliance">
        <p>
          You may only use the Interface if you have the legal capacity to do so and if your use
          complies with the laws that apply to you. You must not use the Interface if you are
          subject to sanctions or located in a jurisdiction embargoed under applicable sanctions
          regimes.
        </p>
        <p>
          Wallet addresses are screened against the Chainalysis on-chain sanctions oracle; the
          Interface is disabled for flagged addresses, which are also excluded from receiving
          staking rewards.
        </p>
      </LegalSection>

      <LegalSection title="5. Risks">
        <p>
          Staking involves substantial risk, including possible loss of tokens. In particular:
          withdrawals are subject to an on-chain unbonding delay and are not on demand; slashing
          does not exist in Safenet Beta but may be introduced post-Beta; rewards for a period
          are forfeited if your validator&rsquo;s participation falls below the protocol
          threshold; and the staking contracts — like all smart contracts — may contain bugs.
          Safenet Beta is exploratory software.
        </p>
        <p>
          Read the official risk disclosure before staking:{" "}
          <LegalLink href={RISKS_DOCS_URL}>Safenet docs — Is my stake at risk?</LegalLink>
        </p>
      </LegalSection>

      <LegalSection title="6. Fees">
        <p>
          The Interface itself charges no fees. Network (gas) fees and any validator commission
          are set by the network and the protocol respectively and are outside Chainza&rsquo;s
          control.
        </p>
      </LegalSection>

      <LegalSection title="7. Dependent services">
        <p>
          The Interface depends on services operated by third parties, including Ethereum RPC
          endpoints, registry data hosted on GitHub, the WalletConnect relay and your own wallet
          software. Chainza does not control these services; their availability and conduct are
          governed by their own terms.
        </p>
        <p>
          The Safenet indexer behind the transaction history is operated by Chainza itself, on a
          best-effort basis. Parts of the Interface may degrade or become unavailable when any of
          these services fail; the core staking flows do not depend on the indexer.
        </p>
      </LegalSection>

      <LegalSection title="8. Open source">
        <p>
          The Interface is open source under the MIT license (
          <LegalLink href="https://github.com/Chainza/safenet-staking-monorepo">
            github.com/Chainza/safenet-staking-monorepo
          </LegalLink>
          ). The license governs your use of the source code; these terms govern your use of the
          hosted Interface.
        </p>
      </LegalSection>

      <LegalSection title="9. Availability and changes">
        <p>
          The Interface is provided free of charge, &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;. We may change, suspend or discontinue it, in whole or in part, at any
          time and without notice.
        </p>
      </LegalSection>

      <LegalSection title="10. Disclaimer and limitation of liability">
        <p>
          To the maximum extent permitted by applicable law, Chainza disclaims all warranties,
          express or implied, and is not liable for any indirect or consequential loss, loss of
          profits, or loss of tokens or other digital assets arising from your use of the
          Interface, the conduct of the underlying smart contracts and protocol, or the failure
          of third-party services. Nothing in these terms excludes liability that cannot be
          excluded under applicable law.
        </p>
      </LegalSection>

      <LegalSection title="11. Governing law">
        <p>
          These terms are governed by the laws of Ukraine. Any dispute arising out of or in
          connection with them is subject to the jurisdiction of the competent courts of
          Ukraine.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to these terms">
        <p>
          We may update these terms from time to time by posting the revised version on this
          page with an updated date. Your continued use of the Interface after a revision takes
          effect constitutes acceptance of the revised terms.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
