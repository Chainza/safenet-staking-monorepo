import { encodeFunctionData, type Address, type Hash, type Hex, type PublicClient } from "viem";
import { merkleDropAbi } from "./abi/merkleDrop.js";
import type { SafeStakeConfig } from "./config.js";
import type { ConnectedWalletClient } from "./types.js";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Current merkle root the drop verifies claims against. */
export function getMerkleRoot(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.merkleDrop,
    abi: merkleDropAbi,
    functionName: "merkleRoot",
  });
}

/** Lifetime rewards `account` has already claimed (base units). */
export function getCumulativeClaimed(
  client: PublicClient,
  config: SafeStakeConfig,
  account: Address,
) {
  return client.readContract({
    address: config.addresses.merkleDrop,
    abi: merkleDropAbi,
    functionName: "cumulativeClaimed",
    args: [account],
  });
}

// ---------------------------------------------------------------------------
// Writes (send)
// ---------------------------------------------------------------------------

/**
 * Claim `account`'s outstanding rewards: the contract transfers
 * `cumulativeAmount - cumulativeClaimed(account)` and records the new total.
 * `cumulativeAmount` + `merkleProof` come from the account's published proof;
 * `expectedMerkleRoot` must match the on-chain root or the tx reverts
 * (`MerkleRootWasUpdated`) — refetch the proof after a root rotation.
 */
export function claim(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  account: Address,
  cumulativeAmount: bigint,
  expectedMerkleRoot: Hex,
  merkleProof: readonly Hex[],
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.merkleDrop,
    abi: merkleDropAbi,
    functionName: "claim",
    args: [account, cumulativeAmount, expectedMerkleRoot, merkleProof],
    account: client.account,
    chain: client.chain,
  });
}

// ---------------------------------------------------------------------------
// Writes (encode)
// ---------------------------------------------------------------------------

/** Encode calldata for `claim(account, cumulativeAmount, expectedMerkleRoot, merkleProof)`. */
export function encodeClaim(
  account: Address,
  cumulativeAmount: bigint,
  expectedMerkleRoot: Hex,
  merkleProof: readonly Hex[],
): Hex {
  return encodeFunctionData({
    abi: merkleDropAbi,
    functionName: "claim",
    args: [account, cumulativeAmount, expectedMerkleRoot, merkleProof],
  });
}
