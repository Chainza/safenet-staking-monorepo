import { type Address } from "viem";
import type { PendingWithdrawal } from "@chainza/safenet-staking-core";
import { ZERO } from "../lib/bigint.js";
import { useWidgetStore } from "../store.js";
import { useSafeBalance } from "./useSafeBalance.js";
import { useStakedBalance } from "./useStakedBalance.js";
import { useValidators, type Validator } from "./useValidators.js";
import { useWithdrawals } from "./useWithdrawals.js";
import { useWithdrawDelay } from "./useWithdrawDelay.js";

export type { Validator } from "./useValidators.js";

/** Contract-shaped staking data for the connected account. Every field maps to
 *  a real `@chainza/safenet-staking-core` read; swapping in `createSafeStakeClient` later
 *  replaces the seed values without touching the component tree. */
export interface StakeData {
  /** Wallet SAFE balance — live `token.getBalance` read (`useSafeBalance`). */
  walletBalance: bigint;
  /** Staked with the selected validator — live `staking.getStake` read (`useStakedBalance`). */
  stakedBalance: bigint;
  /** Withdrawal-queue entries — `staking.getPendingWithdrawals(account)`.
   *  Readonly: viem infers the contract's tuple array as `readonly`. */
  withdrawals: readonly PendingWithdrawal[];
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

/**
 * Staking data for the connected account. Every field maps to a live
 * `@chainza/safenet-staking-core` read via its own query hook; the per-field hooks each gate
 * on the connection and active chain internally, so this aggregator just
 * supplies defaults while their queries are disabled or in flight.
 */
export function useStakeData(): StakeData {
  const selected = useWidgetStore((s) => s.selectedValidator);
  const selectValidator = useWidgetStore((s) => s.selectValidator);
  const validators = useValidators();
  const { data: walletBalance = ZERO } = useSafeBalance();
  const { data: withdrawals = [] } = useWithdrawals();
  const { data: withdrawDelaySec = ZERO } = useWithdrawDelay();

  // `null` selection falls back to the first validator (the default display);
  // `undefined` only while the registry hasn't loaded.
  const selectedValidator = validators.find((v) => v.address === selected) ?? validators[0];
  const { data: stakedBalance = ZERO } = useStakedBalance(selectedValidator?.address);

  return {
    walletBalance,
    stakedBalance,
    withdrawals,
    validators,
    selectedValidator,
    withdrawDelaySec,
    selectValidator,
  };
}
