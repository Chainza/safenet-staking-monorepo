import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address, Hex } from "viem";

/**
 * One account's entry in the published rewards merkle tree
 * (`safe-fndn/safenet-beta-data` → `assets/rewards/proofs/…`), the off-chain
 * half of the MerkleDrop claim: the cumulative (lifetime) reward amount plus
 * the proof for the current root.
 */
export interface RewardProof {
  /** Lifetime rewards accrued (base units, as a decimal string). */
  cumulativeAmount: string;
  /** Root of the tree this proof was generated for. */
  merkleRoot: Hex;
  /** Sibling hashes proving the leaf; `null` while the account can't claim. */
  proof: Hex[] | null;
  /** Rewards withheld pending compliance (KYC) checks, if any. */
  kycAmount?: string;
  /** Whether the account has passed those checks. */
  kyc?: boolean;
}

const REWARDS_BASE_URL =
  "https://raw.githubusercontent.com/safe-fndn/safenet-beta-data/main/assets/rewards";

/** Proofs are sharded by the first four address bytes (`aa/bb/cc/dd/0x….json`). */
function proofUrl(address: Address): string {
  const lower = address.toLowerCase();
  const hex = lower.slice(2, 10);
  const shard = `${hex.slice(0, 2)}/${hex.slice(2, 4)}/${hex.slice(4, 6)}/${hex.slice(6, 8)}`;
  return `${REWARDS_BASE_URL}/proofs/${shard}/${lower}.json`;
}

/** Key for the `useRewardProof` query (chain-independent — an HTTP fetch). */
export const rewardProofQueryKey = (account: Address | undefined) =>
  ["safe-stake", "reward-proof", account] as const;

/**
 * The connected account's reward proof from the official registry. `null`
 * (a 404) means the account has never accrued rewards; disabled while
 * disconnected. Roots rotate rarely, hence the five-minute staleTime.
 */
export function useRewardProof() {
  const { address } = useConnection();

  return useQuery({
    queryKey: rewardProofQueryKey(address),
    enabled: address !== undefined,
    staleTime: 300_000,
    queryFn: async (): Promise<RewardProof | null> => {
      if (address === undefined) {
        throw new Error("reward-proof queryFn ran without an account");
      }
      const response = await fetch(proofUrl(address));
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`reward proof fetch failed: HTTP ${response.status}`);
      }
      return response.json();
    },
  });
}
