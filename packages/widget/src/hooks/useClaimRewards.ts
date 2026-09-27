import { useQueryClient } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { assert } from "ts-essentials";
import { logger } from "../lib/logger.js";
import { useConnectionScopedMutation } from "./useConnectionScopedMutation.js";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import { useTxSender, type TxOutcome } from "./useTxSender.js";
import { useRewardProof } from "./useRewardProof.js";
import { invalidateFlowReads } from "./invalidateFlowReads.js";

/**
 * The claim-rewards write flow as one mutation: `MerkleDrop.claim` with the
 * account's published proof transfers every outstanding reward (the cumulative
 * amount minus what's already claimed) in a single tx, so the mutation needs no
 * variables — the panel only enables it once `useRewards` reports `canClaim`.
 *
 * Once the tx is confirmed it invalidates what it moves: the on-chain claimed
 * counter, the wallet balance (rewards arrive as SAFE) and the proof itself (a
 * root rotation between fetch and claim would otherwise stay cached), via
 * `invalidateFlowReads`; a Safe proposal moves nothing until it executes, when
 * `SafeProposalWatchers` refresh them. Mutations never auto-retry
 * (a write may have broadcast despite an error).
 */
export function useClaimRewards() {
  const { address } = useConnection();
  const client = useSafeStakeClient();
  const sender = useTxSender();
  const queryClient = useQueryClient();
  const { data: proof } = useRewardProof();

  return useConnectionScopedMutation({
    mutationFn: async (): Promise<TxOutcome> => {
      assert(
        client !== undefined && address !== undefined,
        "claim rewards requires a connected wallet on a supported chain",
      );
      assert(proof?.proof, "claim rewards requires a published reward proof");

      const args = [
        address,
        BigInt(proof.cumulativeAmount),
        proof.merkleRoot,
        proof.proof,
      ] as const;
      if (await sender.isSafeAccount()) {
        return sender.batchForSafe("rewards", [
          { to: client.config.addresses.merkleDrop, data: client.rewards.encodeClaim(...args) },
        ]);
      }
      return sender.confirmOnChain(await client.rewards.claim(...args));
    },
    onError: (err) => logger.error("claim rewards failed:", err),
    onSuccess: (outcome) => {
      // A Safe proposal moved nothing yet — its watcher refreshes on execution.
      if (outcome.status !== "confirmed") return;
      invalidateFlowReads(queryClient, "rewards", client?.config.chainId, address);
    },
  });
}
