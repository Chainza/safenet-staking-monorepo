import { CircleCheck, Clock, Inbox } from "lucide-react";
import { formatCountdown, formatToken } from "../lib/format.js";
import { useDateNow } from "../hooks/useDateNow.js";
import { Card } from "./ui/card.js";
import { Button } from "./ui/button.js";
import { Badge } from "./ui/badge.js";
import type { PanelProps } from "./StakePanel.js";

/** Claim flow → `staking.claimWithdrawal()` once a queued withdrawal matures
 *  past the unbonding delay. Matured rows are claimable; the rest count down. */
export function ClaimPanel({ state, symbol }: PanelProps) {
  const { connected, withdrawals } = state;
  const nowMs = useDateNow();

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

  return (
    <div className="ss:animate-rise ss:flex ss:flex-col ss:gap-2">
      <Card className="ss:bg-background ss:flex ss:items-end ss:justify-between ss:p-4">
        <div>
          <div className="ss:mb-2 ss:font-mono ss:text-xs ss:uppercase ss:tracking-wider ss:text-muted-foreground">
            Ready to claim
          </div>
          <div className="ss:font-mono ss:text-2xl ss:font-semibold ss:tracking-tight ss:text-accent-strong">
            {formatToken(claimable)}
            <span className="ss:ml-2 ss:text-sm ss:text-muted-foreground">{symbol}</span>
          </div>
        </div>
        <CircleCheck
          className={
            claimable > 0n ? "ss:size-6 ss:text-primary" : "ss:size-6 ss:text-muted-foreground"
          }
        />
      </Card>

      {withdrawals.map((w, i) => {
        const countdown = formatCountdown(w.claimableAt, nowMs);
        const ready = countdown === null;
        return (
          <Card
            key={i}
            className={`ss:flex ss:items-center ss:gap-2 ss:p-3 ${ready ? "ss:border-primary/30" : ""}`}
          >
            <span
              className={`ss:grid ss:size-8 ss:shrink-0 ss:place-items-center ss:rounded-lg ss:border ss:bg-background ${
                ready
                  ? "ss:border-primary/30 ss:text-primary"
                  : "ss:border-border ss:text-muted-foreground"
              }`}
              aria-hidden
            >
              {ready ? <CircleCheck className="ss:size-4" /> : <Clock className="ss:size-4" />}
            </span>
            <span className="ss:min-w-0 ss:flex-1">
              <div className="ss:font-mono ss:text-sm ss:font-medium">
                {formatToken(w.amount)}{" "}
                <span className="ss:text-xs ss:text-muted-foreground">{symbol}</span>
              </div>
              <Badge
                variant={ready ? "success" : "outline"}
                className={`ss:border-0 ss:px-0 ${ready ? "" : "ss:text-muted-foreground"}`}
              >
                {ready ? "Ready to claim" : `Unbonding · ${countdown} left`}
              </Badge>
            </span>
            {ready && <Button size="sm">Claim</Button>}
          </Card>
        );
      })}
    </div>
  );
}
