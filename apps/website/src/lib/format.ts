import { formatUnits } from "viem";

/** Format a token amount (base units) for display with grouping. */
export function formatToken(amount: bigint, decimals = 18, maxFractionDigits = 2): string {
  const asFloat = Number(formatUnits(amount, decimals));
  return asFloat.toLocaleString("en-US", {
    minimumFractionDigits: maxFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  });
}

/** Truncate a hash/address to `0x1234…cdef` form. */
export function truncateHash(hash: string, lead = 6, tail = 4): string {
  if (hash.length <= lead + tail) return hash;
  return `${hash.slice(0, lead)}…${hash.slice(-tail)}`;
}
