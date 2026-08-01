import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import { useRewardProof } from "./useRewardProof.js";

/** Key for the on-chain `cumulativeClaimed(account)` query. */
export const cumulativeClaimedQueryKey = (
  chainId: number | undefined,
  account: Address | undefined,
) => ["safe-stake", "cumulative-claimed", chainId, account] as const;

/** Key for the on-chain `merkleRoot()` query. */
export const merkleRootQueryKey = (chainId: number | undefined) =>
  ["safe-stake", "merkle-root", chainId] as const;

/** Rewards state derived from the proof + the MerkleDrop's on-chain counters. */
export interface RewardsData {
  /** Outstanding rewards: the proof's cumulative amount minus what's claimed. */
  claimable: bigint;
  /** Lifetime rewards already claimed on-chain. */
  totalClaimed: bigint;
  /** The on-chain root rotated past the fetched proof — a claim would revert. */
  rootStale: boolean;
  /** Ready to submit: something to claim, a usable proof, and a fresh root. */
  canClaim: boolean;
}

/**
 * Claimable rewards for the connected account: `claimable` is the proof's
 * cumulative amount minus the on-chain `cumulativeClaimed` counter (the
 * MerkleDrop is a cumulative drop — one proof per root covers every round).
 * Both on-chain reads gate on a fetched proof and a chain with a known
 * deployment; everything reports zero/false until then.
 */
export function useRewards(): RewardsData {
  const { address } = useConnection();
  const client = useSafeStakeClient();
  const { data: proof } = useRewardProof();

  const hasProof = proof !== undefined && proof !== null;
  const chainId = client?.config.chainId;

  const { data: claimed } = useQuery({
    queryKey: cumulativeClaimedQueryKey(chainId, address),
    enabled: client !== undefined && hasProof && address !== undefined,
    queryFn: () => {
      if (client === undefined || address === undefined) {
        throw new Error("cumulative-claimed queryFn ran without a client or account");
      }
      return client.rewards.getCumulativeClaimed(address);
    },
  });

  const { data: onChainRoot } = useQuery({
    queryKey: merkleRootQueryKey(chainId),
    enabled: client !== undefined && hasProof,
    queryFn: () => {
      if (client === undefined) {
        throw new Error("merkle-root queryFn ran without a client");
      }
      return client.rewards.getMerkleRoot();
    },
  });

  if (proof === undefined || proof === null || claimed === undefined) {
    return { claimable: 0n, totalClaimed: claimed ?? 0n, rootStale: false, canClaim: false };
  }

  const cumulative = BigInt(proof.cumulativeAmount);
  const claimable = cumulative > claimed ? cumulative - claimed : 0n;
  const rootStale = onChainRoot !== undefined && onChainRoot !== proof.merkleRoot;

  return {
    claimable,
    totalClaimed: claimed,
    rootStale,
    canClaim: claimable > 0n && !rootStale && proof.proof !== null,
  };
}
