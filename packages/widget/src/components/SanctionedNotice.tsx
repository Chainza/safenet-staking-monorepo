import { ShieldAlert } from "lucide-react";

/**
 * Blocking notice rendered in place of the action panels when the connected
 * wallet address is flagged by the Chainalysis on-chain sanctions oracle
 * (OFAC). Compliance: flagged addresses are excluded from staking and
 * rewards, so no flow is reachable while one is connected.
 */
export function SanctionedNotice() {
  return (
    <div
      role="alert"
      className="ss:animate-rise ss:flex ss:flex-col ss:items-center ss:gap-2 ss:py-8 ss:text-center ss:text-muted-foreground"
    >
      <span
        className="ss:grid ss:size-12 ss:place-items-center ss:rounded-2xl ss:border ss:border-error/40 ss:bg-error/10"
        aria-hidden
      >
        <ShieldAlert className="ss:size-5 ss:text-error" />
      </span>
      <span className="ss:text-sm ss:font-semibold ss:text-error">Address blocked</span>
      <span className="ss:max-w-[280px] ss:font-mono ss:text-xs">
        The connected wallet address is sanctioned (flagged by the Chainalysis on-chain sanctions
        oracle) and is excluded from staking and rewards.
      </span>
    </div>
  );
}
