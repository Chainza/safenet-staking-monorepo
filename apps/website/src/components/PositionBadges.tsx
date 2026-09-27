import { useId } from "react";
import { useStakePosition } from "../hooks/useStakePosition.js";
import { formatCompactToken, formatToken } from "../lib/format.js";
import { cn } from "../lib/utils.js";
import { BrandLogo } from "./BrandLogo.js";

// Module scope: React Compiler bails out of components with bigint literals.
const ZERO = 0n;

/** Per-state copy for the hint tooltip — what's happening with those tokens. */
const HINTS = {
  staked: "Staked with validators. Unstake to start withdrawing.",
  unstaking: "Leaving stake. Waiting out the withdrawal delay.",
  claimable: "Withdrawal delay over. Claim it in the Claim tab.",
} as const;

interface PositionBadgesProps {
  className?: string;
  /** Which edge of the pill the hint tooltip hugs. `right` suits the header's
   *  right side; the burger menu passes `left` (the pill sits flush left). */
  tooltipAlign?: "left" | "right";
}

/**
 * The connected account's SAFE position as one pill, sized to sit beside the
 * wallet button: total staked (always, so a zero reads as "nothing staked"),
 * plus unstaking and claimable segments only while non-zero. Amounts are
 * compact; hovering or focusing the pill opens a hint with every state's exact
 * amount and what it means. Renders nothing until the (sanctions-screened)
 * read resolves.
 */
export function PositionBadges({ className, tooltipAlign = "right" }: PositionBadgesProps) {
  const tooltipId = useId();
  const { data: position } = useStakePosition();
  if (!position) return null;

  const states = [
    { key: "staked", amount: position.staked, accent: false, pinned: true },
    { key: "unstaking", amount: position.unstaking, accent: false, pinned: false },
    { key: "claimable", amount: position.claimable, accent: true, pinned: false },
  ] as const;
  const segments = states.filter((s) => s.pinned || s.amount > ZERO);

  return (
    <div
      tabIndex={0}
      aria-describedby={tooltipId}
      className={cn(
        "group relative flex items-center gap-2 rounded-full border border-[var(--page-border)] py-2 pr-4 pl-2 text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[var(--page-accent)]",
        className,
      )}
    >
      <BrandLogo className="size-5 shrink-0" role="presentation" aria-label={undefined} />
      <ul aria-label="Your staking position" className="flex items-center">
        {segments.map(({ key, amount, accent }) => (
          <li
            key={key}
            className="flex items-center gap-1 [&:not(:first-child)]:ml-3 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-[var(--page-border)] [&:not(:first-child)]:pl-3"
          >
            <span
              className={cn("font-mono font-medium text-[var(--page-fg)]", {
                "text-[var(--page-accent)]": accent,
              })}
            >
              {formatCompactToken(amount)}
            </span>
            <span className="text-[var(--page-muted)]">{key}</span>
          </li>
        ))}
      </ul>

      {/* Hover/focus hint — CSS-only (group-hover / group-focus-within), so it
          needs no state; kept in the a11y tree via aria-describedby. */}
      <div
        id={tooltipId}
        role="tooltip"
        className={cn(
          "invisible absolute top-full z-20 mt-2 flex w-72 flex-col gap-2 rounded-xl border border-[var(--page-border)] bg-[var(--page-bg)] p-4 text-xs whitespace-normal opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100",
          tooltipAlign === "right" ? "right-0" : "left-0",
        )}
      >
        {states.map(({ key, amount, accent }) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[var(--page-fg)] capitalize">{key}</span>
              <span
                className={cn("font-mono text-[var(--page-fg)]", {
                  "text-[var(--page-accent)]": accent && amount > ZERO,
                })}
              >
                {formatToken(amount)} SAFE
              </span>
            </div>
            <span className="text-[var(--page-muted)]">{HINTS[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
