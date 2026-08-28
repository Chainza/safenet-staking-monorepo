import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address, Hex } from "viem";
import { assert } from "ts-essentials";
import { http } from "../lib/http.js";
import { useSanctionsCleared } from "./useIsSanctioned.js";

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

const HEX_32_BYTES = /^0x[0-9a-fA-F]{64}$/;
const DECIMAL_DIGITS = /^\d+$/;

/**
 * Validate the registry's proof JSON at the trust boundary. The file is
 * external input feeding straight into `BigInt(...)` and an on-chain claim, so
 * a malformed field must fail the query (a rendered error) rather than throw
 * mid-render or send a doomed tx. Throws on the first offending field.
 */
export function parseRewardProof(data: unknown): RewardProof {
  if (typeof data !== "object" || data === null) {
    throw new Error("Malformed reward proof: not an object");
  }
  const {
    cumulativeAmount,
    merkleRoot,
    proof: path,
    kycAmount,
    kyc,
  } = data as Record<string, unknown>;

  if (typeof cumulativeAmount !== "string" || !DECIMAL_DIGITS.test(cumulativeAmount)) {
    throw new Error("Malformed reward proof: cumulativeAmount is not a decimal string");
  }
  if (typeof merkleRoot !== "string" || !HEX_32_BYTES.test(merkleRoot)) {
    throw new Error("Malformed reward proof: merkleRoot is not a 32-byte hex string");
  }
  if (
    path !== null &&
    (!Array.isArray(path) || !path.every((h) => typeof h === "string" && HEX_32_BYTES.test(h)))
  ) {
    throw new Error("Malformed reward proof: proof is not null or an array of 32-byte hex strings");
  }
  if (
    kycAmount !== undefined &&
    (typeof kycAmount !== "string" || !DECIMAL_DIGITS.test(kycAmount))
  ) {
    throw new Error("Malformed reward proof: kycAmount is not a decimal string");
  }
  if (kyc !== undefined && typeof kyc !== "boolean") {
    throw new Error("Malformed reward proof: kyc is not a boolean");
  }

  return {
    cumulativeAmount,
    merkleRoot: merkleRoot as Hex,
    proof: path as Hex[] | null,
    ...(kycAmount !== undefined && { kycAmount }),
    ...(kyc !== undefined && { kyc }),
  };
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
 *
 * This fetch bypasses `useSafeStakeClient` (it's HTTP, not on-chain), so it
 * carries its own fail-closed sanctions gate: no proof is fetched until the
 * screen clears the connected wallet.
 */
export function useRewardProof() {
  const { address } = useConnection();
  const cleared = useSanctionsCleared();

  return useQuery({
    queryKey: rewardProofQueryKey(address),
    enabled: address !== undefined && cleared,
    staleTime: 300_000,
    queryFn: async (): Promise<RewardProof | null> => {
      assert(address !== undefined, "reward-proof queryFn ran without an account");
      // A 404 is an expected answer ("never accrued rewards"), so it's widened
      // into the success range; every other non-2xx throws, as axios does by
      // default, and surfaces as a query error.
      const { status, data } = await http.get<unknown>(proofUrl(address), {
        validateStatus: (s) => s === 404 || (s >= 200 && s < 300),
      });
      return status === 404 ? null : parseRewardProof(data);
    },
  });
}
