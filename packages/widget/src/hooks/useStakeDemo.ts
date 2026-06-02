import { useState } from "react";
import { parseEther, type Address } from "viem";
import type { PendingWithdrawal } from "safe-stake-core";

/** A validator the user can stake against. Mirrors what a `getValidators`-style
 *  read would surface alongside on-chain stake totals. */
export interface Validator {
  address: Address;
  name: string;
  /** Total SAFE delegated to this validator (base units). */
  totalStaked: bigint;
}

export interface StakeDemoState {
  connected: boolean;
  account: Address | null;
  /** Wallet SAFE balance — `token.getBalance(account)`. */
  walletBalance: bigint;
  /** Staked with the selected validator — `staking.getStake(account, validator)`. */
  stakedBalance: bigint;
  /** Withdrawal-queue entries — `staking.getPendingWithdrawals(account)`. */
  withdrawals: PendingWithdrawal[];
  validators: Validator[];
  selectedValidator: Validator;
  /** Unbonding delay in seconds — `staking.getWithdrawDelay()`. */
  withdrawDelaySec: bigint;
}

export interface StakeDemoActions {
  connect: () => void;
  disconnect: () => void;
  selectValidator: (address: Address) => void;
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
 * Local, contract-shaped state for designing and demoing the widget. Every
 * field maps to a real `safe-stake-core` read; swapping in
 * `createSafeStakeClient` later replaces the seed values without touching the
 * component tree.
 */
export function useStakeDemo(): StakeDemoState & StakeDemoActions {
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState<Address>(VALIDATORS[0]!.address);

  const selectedValidator = VALIDATORS.find((v) => v.address === selected) ?? VALIDATORS[0]!;

  const connect = () => setConnected(true);
  const disconnect = () => setConnected(false);
  const selectValidator = (address: Address) => setSelected(address);

  return {
    connected,
    account: connected ? "0x7A16fF8270133F063aAb6C9977183D9e72835428" : null,
    walletBalance: connected ? parseEther("12480.42") : 0n,
    stakedBalance: connected ? parseEther("8200") : 0n,
    withdrawals: connected
      ? [
          { amount: parseEther("750"), claimableAt: NOW_SEC - DAY }, // matured → claimable
          { amount: parseEther("1500"), claimableAt: NOW_SEC + 3n * DAY + 14_400n },
        ]
      : [],
    validators: VALIDATORS,
    selectedValidator,
    withdrawDelaySec: 7n * DAY,
    connect,
    disconnect,
    selectValidator,
  };
}
