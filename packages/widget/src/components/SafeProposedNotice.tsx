import { Hourglass } from "lucide-react";
import type { TxOutcome } from "../hooks/useTxSender.js";

/**
 * Shown under a panel's action once its write flow ended `proposed`: the calls
 * sit in the Safe's queue and nothing on-chain has moved yet. The widget does
 * not track the Safe tx afterwards, so the note tells the user where it
 * continues and why balances haven't changed. Renders nothing for any other
 * outcome (none yet, or a confirmed tx).
 */
export function SafeProposedNotice({ outcome }: { outcome: TxOutcome | undefined }) {
  if (outcome?.status !== "proposed") return null;

  return (
    <p
      role="status"
      className="ss:mt-2 ss:flex ss:items-start ss:gap-2 ss:rounded-lg ss:border ss:border-info/40 ss:bg-info/10 ss:p-3 ss:text-xs ss:text-info"
    >
      <Hourglass className="ss:mt-0.5 ss:size-4 ss:shrink-0" aria-hidden />
      <span>
        Queued in your Safe. Confirm and execute it in Safe{"{Wallet}"} — balances update once it
        runs on-chain.
      </span>
    </p>
  );
}
