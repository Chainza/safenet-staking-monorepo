import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, usePublicClient } from "wagmi";
import type { Hash } from "viem";
import { assert } from "ts-essentials";
import { logger } from "../lib/logger.js";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import { useRewardProof, rewardProofQueryKey } from "./useRewardProof.js";
import { cumulativeClaimedQueryKey } from "./useRewards.js";
import { safeBalanceQueryKey } from "./useSafeBalance.js";

/**
 * The claim-rewards write flow as one mutation: `MerkleDrop.claim` with the
 * account's published proof transfers every outstanding reward (the cumulative
 * amount minus what's already claimed) in a single tx, so the mutation needs no
 * variables — the panel only enables it once `useRewards` reports `canClaim`.
 *
 * On success it invalidates what the tx moves: the on-chain claimed counter,
 * the wallet balance (rewards arrive as SAFE) and the proof itself (a root
 * rotation between fetch and claim would otherwise stay cached). Mutations
 * never auto-retry (a write may have broadcast despite an error).
 */
export function useClaimRewards() {
  const { address } = useConnection();
  const client = useSafeStakeClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const { data: proof } = useRewardProof();

  return useMutation({
    mutationFn: async (): Promise<Hash> => {
      assert(
        client !== undefined && address !== undefined && publicClient !== undefined,
        "claim rewards requires a connected wallet on a supported chain",
      );
      assert(proof?.proof, "claim rewards requires a published reward proof");

      const hash = await client.rewards.claim(
        address,
        BigInt(proof.cumulativeAmount),
        proof.merkleRoot,
        proof.proof,
      );
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onError: (err) => logger.error("claim rewards failed:", err),
    onSuccess: () => {
      const chainId = client?.config.chainId;
      queryClient.invalidateQueries({ queryKey: cumulativeClaimedQueryKey(chainId, address) });
      queryClient.invalidateQueries({ queryKey: safeBalanceQueryKey(chainId, address) });
      queryClient.invalidateQueries({ queryKey: rewardProofQueryKey(address) });
    },
  });
}
