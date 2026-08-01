import { parseAbi } from "viem";

/**
 * ABI of the SAFE rewards `MerkleDrop` contract — a *cumulative* merkle drop:
 * each published root commits to every account's lifetime reward total, and
 * `claim` transfers `cumulativeAmount - cumulativeClaimed(account)`, so one
 * proof per root covers all rounds. `expectedMerkleRoot` guards against the
 * root rotating between proof fetch and claim (`MerkleRootWasUpdated`).
 */
export const merkleDropAbi = parseAbi([
  "function merkleRoot() view returns (bytes32)",
  "function cumulativeClaimed(address account) view returns (uint256)",
  "function claim(address account, uint256 cumulativeAmount, bytes32 expectedMerkleRoot, bytes32[] merkleProof)",
  "event Claimed(address indexed account, uint256 amount)",
  "error InvalidProof()",
  "error NothingToClaim()",
  "error MerkleRootWasUpdated()",
]);
