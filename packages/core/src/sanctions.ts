import type { Address, PublicClient } from "viem";
import { sanctionsListAbi } from "./abi/sanctionsList.js";
import type { SafeStakeConfig } from "./config.js";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Whether `account` is flagged by the Chainalysis on-chain sanctions oracle
 * (addresses sanctioned by OFAC). Consumers must exclude flagged addresses
 * from staking and rewards — the widget disables its UI for them.
 */
export function isSanctioned(client: PublicClient, config: SafeStakeConfig, account: Address) {
  return client.readContract({
    address: config.addresses.sanctionsList,
    abi: sanctionsListAbi,
    functionName: "isSanctioned",
    args: [account],
  });
}
