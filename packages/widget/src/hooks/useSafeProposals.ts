import { useChainId, useConnection } from "wagmi";
import { isAddressEqual } from "viem";
import { useWidgetStore, type SafeProposal, type WriteFlow } from "../store.js";

/** Every Safe proposal of the connected account on the active chain. Another
 *  account's (or chain's) proposals stay in the store but are never shown or
 *  watched here — only its own connector can report their status. */
export function useSafeProposals(): SafeProposal[] {
  const { address } = useConnection();
  const chainId = useChainId();
  // Select the stable array and filter outside the selector — a filtering
  // selector would return a new array every render.
  const proposals = useWidgetStore((s) => s.safeProposals);
  if (address === undefined) return [];
  return proposals.filter((p) => p.chainId === chainId && isAddressEqual(p.account, address));
}

/**
 * The Safe proposal a panel shows for its flow: the pending one if any (a
 * panel's action waits on it), else the latest failed one (its notice), else
 * `undefined`. Read from the store, so it survives the panel's tab unmounting.
 */
export function useSafeProposal(flow: WriteFlow): SafeProposal | undefined {
  const mine = useSafeProposals().filter((p) => p.flow === flow);
  return mine.find((p) => p.status === "pending") ?? mine.at(-1);
}
