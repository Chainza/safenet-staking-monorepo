import { parseEther, type Address } from "viem";
import type { PendingWithdrawal } from "safe-stake-core";
import { useWidgetStore } from "../store.js";
import { useSafeBalance } from "./useSafeBalance.js";
import { useStakedBalance } from "./useStakedBalance.js";

/** A validator the user can stake against. Mirrors what a `getValidators`-style
 *  read would surface alongside on-chain stake totals. */
export interface Validator {
  address: Address;
  name: string;
  /** Total SAFE delegated to this validator (base units). */
  totalStaked: bigint;
}

/** Contract-shaped staking data for the connected account. Every field maps to
 *  a real `safe-stake-core` read; swapping in `createSafeStakeClient` later
 *  replaces the seed values without touching the component tree. */
export interface StakeData {
  /** Wallet SAFE balance — live `token.getBalance` read (`useSafeBalance`). */
  walletBalance: bigint;
  /** Staked with the selected validator — live `staking.getStake` read (`useStakedBalance`). */
  stakedBalance: bigint;
  /** Withdrawal-queue entries — `staking.getPendingWithdrawals(account)`. */
  withdrawals: PendingWithdrawal[];
  validators: Validator[];
  selectedValidator: Validator;
  /** Unbonding delay in seconds — `staking.getWithdrawDelay()`. */
  withdrawDelaySec: bigint;
  selectValidator: (address: Address) => void;
}

/** The full state the panels consume: connection status plus staking data. */
export interface StakeViewState extends StakeData {
  connected: boolean;
  account: Address | null;
}

const NOW_SEC = BigInt(Math.floor(Date.now() / 1000));
const DAY = 86_400n;

const VALIDATORS: Validator[] = [
  {
    address: "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326",
    name: "SAFE Foundation",
    totalStaked: parseEther("4821000"),
  },
  {
    address: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
    name: "Chorus One",
    totalStaked: parseEther("2140500"),
  },
  {
    address: "0x388C818CA8B9251b393131C08a736A67ccB19297",
    name: "P2P.org",
    totalStaked: parseEther("1763200"),
  },
];

/**
 * Staking data for the connected account. `walletBalance` and `stakedBalance`
 * are live on-chain reads; the remaining fields are still local seed values
 * gated on the connection, each to be replaced by its core read in later passes.
 */
export function useStakeData(isConnected: boolean): StakeData {
  const selected = useWidgetStore((s) => s.selectedValidator);
  const selectValidator = useWidgetStore((s) => s.selectValidator);
  const { data: walletBalance = 0n } = useSafeBalance();

  // `null` selection falls back to the first validator (the default display).
  const selectedValidator = VALIDATORS.find((v) => v.address === selected) ?? VALIDATORS[0]!;

  const { data: stakedBalance = 0n } = useStakedBalance(selectedValidator.address);

  return {
    walletBalance,
    stakedBalance,
    withdrawals: isConnected
      ? [
          { amount: parseEther("750"), claimableAt: NOW_SEC - DAY }, // matured → claimable
          { amount: parseEther("1500"), claimableAt: NOW_SEC + 3n * DAY + 14_400n },
        ]
      : [],
    validators: VALIDATORS,
    selectedValidator,
    withdrawDelaySec: 7n * DAY,
    selectValidator,
  };
}
