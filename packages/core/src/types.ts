import type { Account, Address, Chain, Transport, WalletClient } from "viem";

/**
 * A viem wallet client that is connected — it carries both an `account` and a
 * `chain`. Write helpers require this so transactions can be signed and sent
 * without the caller re-specifying account/chain on every call.
 *
 * The package never creates this; consumers pass their own (e.g. from
 * `createWalletClient(...)` or wagmi's `getWalletClient()`).
 */
export type ConnectedWalletClient = WalletClient<Transport, Chain, Account>;

/** A single pending withdrawal entry returned by `getPendingWithdrawals`. */
export interface PendingWithdrawal {
  amount: bigint;
  claimableAt: bigint;
}

/** Immutable ERC-20 token metadata, read together in one multicall. */
export interface TokenMeta {
  name: string;
  symbol: string;
  decimals: number;
}

/** Re-export of the address type for convenience. */
export type { Address };
