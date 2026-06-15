import { CircleCheck, Clock, Inbox } from "lucide-react";
import { formatCountdown, formatToken } from "../lib/format.js";
import { useDateNow } from "../hooks/useDateNow.js";
import { useClaim } from "../hooks/useClaim.js";
import { cn } from "../lib/utils.js";
import { Card } from "./ui/card.js";
import { Button } from "./ui/button.js";
import { Badge } from "./ui/badge.js";
import type { PanelProps } from "./StakePanel.js";

/** Claim flow → `staking.claimWithdrawal()` once a queued withdrawal matures
 *  past the unbonding delay. The contract settles the **queue head** (the oldest
 *  matured entry) one at a time, so the panel exposes a single "Claim next"
 *  action rather than per-row buttons; the rows are a read-only status list. */
export function ClaimPanel({ state, symbol, decimals }: PanelProps) {
  const { connected, withdrawals } = state;
  const nowMs = useDateNow();
  const { mutate: claim, isPending, error } = useClaim();

  if (!connected || withdrawals.length === 0) {
    return (
      <div className="ss:animate-rise ss:flex ss:flex-col ss:items-center ss:gap-2 ss:py-8 ss:text-center ss:text-muted-foreground">
        <span
          className="ss:grid ss:size-12 ss:place-items-center ss:rounded-2xl ss:border ss:border-border ss:bg-background"
          aria-hidden
        >
          <Inbox className="ss:size-5" />
        </span>
        <span className="ss:text-sm ss:font-semibold ss:text-foreground">
          No pending withdrawals
        </span>
        <span className="ss:max-w-[240px] ss:font-mono ss:text-xs">
          {connected
            ? "Unstaked tokens will appear here while they finish unbonding."
            : "Connect your wallet to see withdrawals ready to claim."}
        </span>
      </div>
    );
  }

  const claimable = withdrawals
    .filter((w) => formatCountdown(w.claimableAt, nowMs) === null)
    .reduce((sum, w) => sum + w.amount, 0n);
  const hasClaimable = claimable > 0n;

  // `claimWithdrawal()` always settles the queue head, so a single button drives
  // the whole panel: blocked while a claim is in flight or nothing has matured.
  let label: string;
  let canSubmit: boolean;
  if (isPending) {
    label = "Claiming…";
    canSubmit = false;
  } else if (!hasClaimable) {
    label = "Nothing to claim yet";
    canSubmit = false;
  } else {
    label = "Claim next";
    canSubmit = true;
  }

  return (
    <div className="ss:animate-rise ss:flex ss:flex-col ss:gap-2">
      <Card className="ss:bg-background ss:flex ss:items-end ss:justify-between ss:p-4">
        <div>
          <div className="ss:mb-2 ss:font-mono ss:text-xs ss:uppercase ss:tracking-wider ss:text-muted-foreground">
            Ready to claim
          </div>
          <div className="ss:font-mono ss:text-2xl ss:font-semibold ss:tracking-tight ss:text-accent-strong">
            {formatToken(claimable, decimals)}
            <span className="ss:ml-2 ss:text-sm ss:text-muted-foreground">{symbol}</span>
          </div>
        </div>
        <CircleCheck
          className={
            hasClaimable ? "ss:size-6 ss:text-primary" : "ss:size-6 ss:text-muted-foreground"
          }
        />
      </Card>

      {withdrawals.map((w, i) => {
        const countdown = formatCountdown(w.claimableAt, nowMs);
        const ready = countdown === null;
        return (
          <Card
            key={i}
            className={cn("ss:flex ss:items-center ss:gap-2 ss:p-3", {
              "ss:border-primary/30": ready,
            })}
          >
            <span
              className={cn(
                "ss:grid ss:size-8 ss:shrink-0 ss:place-items-center ss:rounded-lg ss:border ss:bg-background",
                ready
                  ? "ss:border-primary/30 ss:text-primary"
                  : "ss:border-border ss:text-muted-foreground",
              )}
              aria-hidden
            >
              {ready ? <CircleCheck className="ss:size-4" /> : <Clock className="ss:size-4" />}
            </span>
            <span className="ss:min-w-0 ss:flex-1">
              <div className="ss:font-mono ss:text-sm ss:font-medium">
                {formatToken(w.amount, decimals)}{" "}
                <span className="ss:text-xs ss:text-muted-foreground">{symbol}</span>
              </div>
              <Badge
                variant={ready ? "success" : "outline"}
                className={cn("ss:border-0 ss:px-0", { "ss:text-muted-foreground": !ready })}
              >
                {ready ? "Ready to claim" : `Unbonding · ${countdown} left`}
              </Badge>
            </span>
          </Card>
        );
      })}

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
