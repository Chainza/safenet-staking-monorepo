import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWaitForCallsStatus, useWaitForTransactionReceipt } from "wagmi";
import { logger } from "../lib/logger.js";
import { useWidgetStore, type SafeProposal } from "../store.js";
import { useSafeProposals } from "../hooks/useSafeProposals.js";
import { invalidateFlowReads } from "../hooks/invalidateFlowReads.js";

/** How often a pending proposal's status is polled (and a failed poll retried). */
export const SAFE_STATUS_POLL_MS = 5_000;

/**
 * Mounted once at the widget root: one watcher per pending Safe proposal of
 * the connected account, so a proposal keeps being awaited whichever tab is
 * open. Renders nothing.
 */
export function SafeProposalWatchers() {
  const pending = useSafeProposals().filter((p) => p.status === "pending");
  return pending.map((proposal) => <SafeProposalWatcher key={proposal.id} proposal={proposal} />);
}

/**
 * Waits for one proposal with wagmi's EIP-5792 `useWaitForCallsStatus` until
 * the Safe executes it — no timeout, since a multisig may take days, and
 * failed polls retried indefinitely, since Safe answers "Transaction not found"
 * until its backend has indexed a fresh proposal. On success it waits for the
 * execution tx's receipt on the widget's own RPC (so refetched reads can't
 * come from a node a block behind), then refreshes the flow's reads and drops
 * the proposal; a failed or cancelled Safe tx is marked `failed` instead.
 */
function SafeProposalWatcher({ proposal }: { proposal: SafeProposal }) {
  const queryClient = useQueryClient();
  const failSafeProposal = useWidgetStore((s) => s.failSafeProposal);
  const removeSafeProposal = useWidgetStore((s) => s.removeSafeProposal);

  const { data: calls } = useWaitForCallsStatus({
    id: proposal.id,
    timeout: 0,
    pollingInterval: SAFE_STATUS_POLL_MS,
    query: { retry: true, retryDelay: SAFE_STATUS_POLL_MS },
  });
  const executed = calls?.status === "success";
  // Safe reports its single execution tx once per call — any receipt carries it.
  const hash = executed ? calls.receipts?.[0]?.transactionHash : undefined;
  const receipt = useWaitForTransactionReceipt({ hash, chainId: proposal.chainId });

  const failed = calls?.status === "failure";
  // Settled once the receipt is in — or failed to arrive: the Safe already
  // reported the execution, so refresh regardless rather than hang.
  const settled = executed && (hash === undefined || !receipt.isPending);

  useEffect(() => {
    if (failed) {
      logger.warn(`${proposal.flow}: Safe transaction ${proposal.id} failed or was cancelled`);
      failSafeProposal(proposal.id);
    } else if (settled) {
      logger.info(`${proposal.flow}: Safe transaction ${proposal.id} executed`);
      invalidateFlowReads(queryClient, proposal.flow, proposal.chainId, proposal.account);
      removeSafeProposal(proposal.id);
    }
  }, [failed, settled, proposal, queryClient, failSafeProposal, removeSafeProposal]);

  return null;
}
