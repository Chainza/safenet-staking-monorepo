import { CircleX, Hourglass } from "lucide-react";
import type { SafeProposal } from "../store.js";

/**
 * Shown under a panel's action while its flow has a Safe proposal
 * (`useSafeProposal`). Pending: the calls sit in the Safe's queue and nothing
 * on-chain has moved yet — the note says where it continues; it disappears
 * (and the balances refresh) once the Safe executes it. Failed: the Safe
 * reported the transaction failed or was cancelled. Renders nothing without a
 * proposal.
 */
export function SafeProposedNotice({ proposal }: { proposal: SafeProposal | undefined }) {
  if (proposal === undefined) return null;

  if (proposal.status === "failed") {
    return (
      <p
        role="alert"
        className="ss:mt-2 ss:flex ss:items-start ss:gap-2 ss:rounded-lg ss:border ss:border-error/40 ss:bg-error/10 ss:p-3 ss:text-xs ss:text-error"
      >
        <CircleX className="ss:mt-0.5 ss:size-4 ss:shrink-0" aria-hidden />
        <span>Your Safe transaction failed or was cancelled. Nothing was moved.</span>
      </p>
    );
  }

  return (
    <p
      role="status"
      className="ss:mt-2 ss:flex ss:items-start ss:gap-2 ss:rounded-lg ss:border ss:border-info/40 ss:bg-info/10 ss:p-3 ss:text-xs ss:text-info"
    >
      <Hourglass className="ss:mt-0.5 ss:size-4 ss:shrink-0" aria-hidden />
      <span>
        Queued in your Safe. Confirm and execute it in Safe{"{Wallet}"} — balances update
        automatically once it runs on-chain.
      </span>
    </p>
  );
}
