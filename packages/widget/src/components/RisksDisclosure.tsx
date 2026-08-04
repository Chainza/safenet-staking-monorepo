import { useState } from "react";
import { ArrowUpRight, ChevronDown, TriangleAlert } from "lucide-react";
import { dayCount } from "../lib/format.js";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible.js";

/** The official risk disclosure the items below are sourced from. */
const RISKS_DOCS_URL = "https://docs.safefoundation.org/safenet/staking/risk";

/**
 * Staking risk disclosure — collapsed by default, one entry per risk from the
 * official Safenet docs ({@link RISKS_DOCS_URL}): unbonding delay (the live
 * on-chain withdraw delay), slashing (none in Beta), validator performance
 * (rewards forfeited below 75% participation) and smart-contract risk.
 */
export function RisksDisclosure({ withdrawDelaySec }: { withdrawDelaySec: bigint }) {
  const [open, setOpen] = useState(false);

  const risks = [
    {
      title: "Unbonding delay",
      body: `Unstaking locks tokens for the ${dayCount(withdrawDelaySec)}-day withdrawal delay — withdrawals are not on-demand and cannot be expedited.`,
    },
    {
      title: "Slashing",
      body: "No slashing in Safenet Beta: staked SAFE cannot be confiscated or destroyed. Once slashing is introduced post-Beta, a portion of stake could be at risk if a validator misbehaves.",
    },
    {
      title: "Validator performance",
      body: "If your validator's participation falls below 75% in a reward period, that period's rewards are forfeited — your stake is unaffected. Switching validators requires a full unstake and restake.",
    },
    {
      title: "Smart-contract risk",
      body: "The staking contract is audited and non-upgradeable, but Safenet Beta is exploratory software and may contain bugs — you interact with it at your own risk.",
    },
  ];

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="ss:mt-4 ss:rounded-xl ss:border ss:border-border ss:bg-background"
    >
      <CollapsibleTrigger className="ss:flex ss:w-full ss:cursor-pointer ss:items-center ss:gap-2 ss:rounded-xl ss:px-4 ss:py-3 ss:text-xs ss:font-medium ss:text-muted-foreground ss:outline-none ss:transition-colors ss:hover:text-foreground ss:focus-visible:ring-2 ss:focus-visible:ring-ring/40">
        <TriangleAlert className="ss:size-4 ss:text-warning" aria-hidden />
        Staking involves risk
        <ChevronDown
          className={`ss:ml-auto ss:size-4 ss:transition-transform ${open ? "ss:rotate-180" : ""}`}
          aria-hidden
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="ss:animate-rise ss:flex ss:flex-col ss:gap-3 ss:px-4 ss:pb-4">
        {risks.map(({ title, body }) => (
          <div key={title} className="ss:text-xs">
            <div className="ss:mb-1 ss:font-medium ss:text-foreground">{title}</div>
            <p className="ss:text-muted-foreground">{body}</p>
          </div>
        ))}
        <a
          href={RISKS_DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="ss:inline-flex ss:items-center ss:gap-1 ss:text-xs ss:font-medium ss:text-accent-strong ss:transition-colors ss:hover:text-foreground"
        >
          Learn more in the Safenet docs
          <ArrowUpRight className="ss:size-3" aria-hidden />
        </a>
      </CollapsibleContent>
    </Collapsible>
  );
}
