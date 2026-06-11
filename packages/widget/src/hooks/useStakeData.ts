import { parseEther, type Address } from "viem";
import type { PendingWithdrawal } from "safe-stake-core";
import { useWidgetStore } from "../store.js";
import { useSafeBalance } from "./useSafeBalance.js";
import { useStakedBalance } from "./useStakedBalance.js";
import { useValidators, type Validator } from "./useValidators.js";

export type { Validator } from "./useValidators.js";

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
  /** Stakeable validator set — registry JSON + live stake totals (`useValidators`). */
  validators: Validator[];
  /** `undefined` only while the validator registry is still loading (or failed). */
  selectedValidator: Validator | undefined;
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

/**
 * Staking data for the connected account. `walletBalance`, `stakedBalance` and
 * `validators` are live; the remaining fields are still local seed values
 * gated on the connection, each to be replaced by its core read in later passes.
 */
export function useStakeData(isConnected: boolean): StakeData {
  const selected = useWidgetStore((s) => s.selectedValidator);
  const selectValidator = useWidgetStore((s) => s.selectValidator);
  const validators = useValidators();
  const { data: walletBalance = 0n } = useSafeBalance();

  // `null` selection falls back to the first validator (the default display);
  // `undefined` only while the registry hasn't loaded.
  const selectedValidator = validators.find((v) => v.address === selected) ?? validators[0];
  const { data: stakedBalance = 0n } = useStakedBalance(selectedValidator?.address);

  return {
    walletBalance,
    stakedBalance,
    withdrawals: isConnected
      ? [
          { amount: parseEther("750"), claimableAt: NOW_SEC - DAY }, // matured → claimable
          { amount: parseEther("1500"), claimableAt: NOW_SEC + 3n * DAY + 14_400n },
        ]
      : [],
    validators,
    selectedValidator,
    withdrawDelaySec: 7n * DAY,
    selectValidator,
  };
}
