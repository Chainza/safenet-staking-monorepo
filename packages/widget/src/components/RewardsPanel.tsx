import { Gift, Sparkles } from "lucide-react";
import { ZERO } from "../lib/bigint.js";
import { formatToken } from "../lib/format.js";
import { useRewardProof } from "../hooks/useRewardProof.js";
import { useRewards } from "../hooks/useRewards.js";
import { useClaimRewards } from "../hooks/useClaimRewards.js";
import { useWrongNetwork } from "../hooks/useWrongNetwork.js";
import { Card } from "./ui/card.js";
import { Button } from "./ui/button.js";
import { Summary, SummaryRow } from "./Summary.js";
import type { PanelProps } from "./StakePanel.js";

/** Rewards flow → `MerkleDrop.claim` with the account's published proof.
 *  The drop is *cumulative*: one claim transfers every outstanding reward
 *  (proof's lifetime total minus the on-chain claimed counter), so the panel
 *  is a single summary + one "Claim rewards" action — no amount input. */
export function RewardsPanel({ state, symbol, decimals }: PanelProps) {
  const { connected } = state;
  const { data: proof } = useRewardProof();
  const rewards = useRewards();
  const { mutate: claim, isPending, error } = useClaimRewards();
  const wrongNetwork = useWrongNetwork();

  // A missing proof covers both "still loading" and "no rewards ever" (404).
  if (!connected || proof === undefined || proof === null) {
    return (
      <div className="ss:animate-rise ss:flex ss:flex-col ss:items-center ss:gap-2 ss:py-8 ss:text-center ss:text-muted-foreground">
        <span
          className="ss:grid ss:size-12 ss:place-items-center ss:rounded-2xl ss:border ss:border-border ss:bg-background"
          aria-hidden
        >
          <Gift className="ss:size-5" />
        </span>
        <span className="ss:text-sm ss:font-semibold ss:text-foreground">No rewards yet</span>
        <span className="ss:max-w-[240px] ss:font-mono ss:text-xs">
          {connected
            ? "Staking rewards will appear here once distributed to your account."
            : "Connect your wallet to see your claimable rewards."}
        </span>
      </div>
    );
  }

  // Rewards withheld until the account clears the foundation's KYC checks.
  const kycPending =
    proof.kycAmount !== undefined && BigInt(proof.kycAmount) > ZERO && proof.kyc !== true;

  // Same cascade shape as the other panels: every branch before the last is a
  // blocked state; only the final one submits.
  let label: string;
  let canSubmit: boolean;
  if (wrongNetwork) {
    label = "Wrong Network";
    canSubmit = false;
  } else if (isPending) {
    label = "Claiming…";
    canSubmit = false;
  } else if (rewards.rootStale) {
    label = "Rewards update in progress";
    canSubmit = false;
  } else if (!rewards.canClaim) {
    label = "Nothing to claim yet";
    canSubmit = false;
  } else {
    label = "Claim rewards";
    canSubmit = true;
  }

  return (
    <div className="ss:animate-rise ss:flex ss:flex-col ss:gap-2">
      <Card className="ss:bg-background ss:flex ss:items-end ss:justify-between ss:p-4">
        <div>
          <div className="ss:mb-2 ss:font-mono ss:text-xs ss:uppercase ss:tracking-wider ss:text-muted-foreground">
            Claimable rewards
          </div>
          <div className="ss:font-mono ss:text-2xl ss:font-semibold ss:tracking-tight ss:text-accent-strong">
            {formatToken(rewards.claimable, decimals)}
            <span className="ss:ml-2 ss:text-sm ss:text-muted-foreground">{symbol}</span>
          </div>
        </div>
        <Sparkles
          className={
            rewards.canClaim ? "ss:size-6 ss:text-primary" : "ss:size-6 ss:text-muted-foreground"
          }
        />
      </Card>

      <Summary>
        <SummaryRow label="Total claimed">
          {formatToken(rewards.totalClaimed, decimals)} {symbol}
        </SummaryRow>
      </Summary>

      {kycPending && (
        <p className="ss:font-mono ss:text-xs ss:text-muted-foreground">
          Some rewards are pending compliance checks. Reach out to the Safe Ecosystem Foundation at
          legal@safefoundation.org.
        </p>
      )}

      <Button
        size="lg"
        className="ss:mt-4 ss:w-full"
        disabled={!canSubmit}
        onClick={() => canSubmit && claim()}
      >
        {label}
      </Button>

      {error && (
        <p className="ss:mt-2 ss:text-center ss:text-xs ss:text-error" role="alert">
          Claim failed. Please try again.
        </p>
      )}
    </div>
  );
}
