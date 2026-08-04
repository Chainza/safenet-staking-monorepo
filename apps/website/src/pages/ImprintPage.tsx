import { LegalArticle, LegalLink, LegalSection } from "../components/LegalArticle.js";

/** Imprint: the operator's identity, as required for operator disclosure. */
export function ImprintPage() {
  return (
    <LegalArticle title="Imprint" updated="4 August 2026">
      <LegalSection title="Operator">
        <p>This website and the staking interface it hosts are operated by:</p>
        <p className="text-[var(--page-fg)]">
          LIMITED LIABILITY COMPANY &ldquo;CHAINZA&rdquo;
          <br />
          21 Shvabska Street, office 1
          <br />
          Uzhhorod, 88018
          <br />
          Ukraine
        </p>
        <p>
          Director: Vladyslav Myronenko
          <br />
          Website: <LegalLink href="https://chainza.io/">https://chainza.io/</LegalLink>
          <br />
          Email: <LegalLink href="mailto:connect@chainza.io">connect@chainza.io</LegalLink>
        </p>
      </LegalSection>

      <LegalSection title="Role of the operator">
        <p>
          Chainza operates this non-custodial interface to the Safenet Beta staking smart contracts
          on Ethereum mainnet. The Safenet protocol, the staking contracts and the SAFE token are
          developed and published by the Safe Ecosystem Foundation and its contributors — not by
          Chainza. Chainza does not custody assets, does not operate validators and is not a
          counterparty to any staking transaction.
        </p>
        <p>
          The interface is open source under the MIT license:{" "}
          <LegalLink href="https://github.com/Chainza/safenet-staking-monorepo">
            github.com/Chainza/safenet-staking-monorepo
          </LegalLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For inquiries, please reach out at{" "}
          <LegalLink href="mailto:connect@chainza.io">connect@chainza.io</LegalLink> or via{" "}
          <LegalLink href="https://chainza.io/">chainza.io</LegalLink>.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
