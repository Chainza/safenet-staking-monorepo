import { formatUnits, parseUnits, type Address } from "viem";

/** Format a token amount (base units, 18 decimals) for display with grouping. */
export function formatToken(amount: bigint, decimals = 18, maxFractionDigits = 2): string {
  const asFloat = Number(formatUnits(amount, decimals));
  return asFloat.toLocaleString("en-US", {
    minimumFractionDigits: maxFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  });
}

/** Parse a user-entered amount into base units; invalid/empty input → `0n`. */
export function parseAmount(value: string, decimals: number): bigint {
  try {
    return value ? parseUnits(value, decimals) : 0n;
  } catch {
    return 0n;
  }
}

/** Truncate an address to `0x1234…cdef` form. */
export function truncateAddress(address: Address | string, lead = 6, tail = 4): string {
  if (address.length <= lead + tail) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

/**
 * Human countdown from now until a unix-seconds timestamp.
 * Returns `null` once the target is in the past (i.e. claimable).
 */
export function formatCountdown(claimableAtSec: bigint, nowMs: number): string | null {
  const remainingMs = Number(claimableAtSec) * 1000 - nowMs;
  if (remainingMs <= 0) return null;

  const totalMinutes = Math.floor(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
