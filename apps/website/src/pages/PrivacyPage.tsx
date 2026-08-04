import { LegalArticle, LegalLink, LegalSection } from "../components/LegalArticle.js";

/** Privacy policy: what actually leaves the browser, and to whom. */
export function PrivacyPage() {
  return (
    <LegalArticle title="Privacy Policy" updated="4 August 2026">
      <LegalSection title="1. Who we are">
        <p>
          This website and the staking interface it hosts (the &ldquo;Interface&rdquo;) are operated
          by LIMITED LIABILITY COMPANY &ldquo;CHAINZA&rdquo;, 21 Shvabska Street, office 1,
          Uzhhorod, 88018, Ukraine. For privacy inquiries, please reach out at{" "}
          <LegalLink href="mailto:connect@chainza.io">connect@chainza.io</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="2. The short version">
        <p>
          The Interface runs entirely in your browser. There are no user accounts, no cookies, no
          analytics or tracking scripts. The only service operated by Chainza itself is the Safenet
          indexer that powers the transaction history; every other service the Interface talks to is
          operated by a third party and reached directly from your browser.
        </p>
      </LegalSection>

      <LegalSection title="3. Data that leaves your browser">
        <p>
          When you use the Interface, your browser communicates directly with the following
          services. Each of them technically receives your IP address; the additional data per
          service is:
        </p>
        <ul className="flex list-disc flex-col gap-3 pl-5">
          <li>
            <span className="font-medium text-[var(--page-fg)]">Ethereum RPC endpoint</span>{" "}
            (eth.blockrazor.xyz) — your wallet address and the on-chain data you request, to read
            chain state, submit the transactions you sign, and screen your address against the
            on-chain Chainalysis sanctions oracle.
          </li>
          <li>
            <span className="font-medium text-[var(--page-fg)]">Safenet indexer</span> (operated by
            Chainza) — your wallet address, used to return your staking transaction history on the
            Activity page. The indexer stores indexed public on-chain events, not user accounts or
            profiles; standard access logs may be kept for operations and security.
          </li>
          <li>
            <span className="font-medium text-[var(--page-fg)]">GitHub</span>{" "}
            (raw.githubusercontent.com) — requests for the public validator registry, and
            reward-proof lookups whose URL contains your wallet address.
          </li>
          <li>
            <span className="font-medium text-[var(--page-fg)]">WalletConnect relay</span> — only if
            you connect via WalletConnect: the connection metadata required to pair with your
            wallet.
          </li>
        </ul>
        <p>
          Apart from the Chainza-operated indexer, these providers are third parties processing data
          under their own privacy policies, which Chainza does not control.
        </p>
      </LegalSection>

      <LegalSection title="4. Data stored on your device">
        <p>
          The Interface keeps a small amount of state in your browser&rsquo;s local storage: your
          theme preference, your wallet-connection state (via wagmi) and, if used, your
          WalletConnect session. This data never leaves your device as such and you can remove it at
          any time by clearing your browser storage.
        </p>
      </LegalSection>

      <LegalSection title="5. Blockchain data">
        <p>
          Transactions you submit — staking, withdrawals, reward claims — are recorded on the public
          Ethereum blockchain, permanently and world-readably, linked to your wallet address. This
          is inherent to the technology: neither Chainza nor anyone else can modify or erase
          on-chain data.
        </p>
      </LegalSection>

      <LegalSection title="6. Your rights">
        <p>
          Applicable data-protection law (including the Law of Ukraine &ldquo;On Protection of
          Personal Data&rdquo; and, where it applies to you, the GDPR) grants you rights such as
          access, rectification and erasure. Beyond the indexer&rsquo;s record of public on-chain
          events and its access logs, Chainza stores no personal data about you; requests concerning
          the third-party services listed above generally need to be directed at those providers.
          For anything Chainza can act on or assist with, reach out at{" "}
          <LegalLink href="mailto:connect@chainza.io">connect@chainza.io</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="7. Changes">
        <p>
          We may update this policy from time to time by posting the revised version on this page
          with an updated date.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
