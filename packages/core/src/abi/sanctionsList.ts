import { parseAbi } from "viem";

/**
 * ABI of the Chainalysis on-chain sanctions oracle (`SanctionsList`) — a
 * public registry of OFAC-sanctioned addresses maintained by Chainalysis
 * (https://go.chainalysis.com/chainalysis-oracle-docs.html). Only the
 * screening read is included; list management is Chainalysis-owned and not
 * part of this package's surface.
 */
export const sanctionsListAbi = parseAbi([
  "function isSanctioned(address addr) view returns (bool)",
]);
