import type { Hash, PublicClient } from "viem";

/**
 * Wait for a tx to mine and reject unless it succeeded. A mined-but-reverted
 * tx ("reverted" receipt status) is a real failure the flows must surface —
 * without this check the mutation would resolve and the panels would report
 * success for a stake/claim that never happened.
 */
export async function waitForSuccessfulReceipt(
  publicClient: PublicClient,
  hash: Hash,
): Promise<void> {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") {
    throw new Error(`Transaction reverted on-chain (${hash})`);
  }
}
