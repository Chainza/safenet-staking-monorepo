import { useState } from "react";
import { parseUnits } from "viem";
import type { StakeViewState } from "../hooks/useStakeData.js";
import { useSafeAllowance } from "../hooks/useSafeAllowance.js";
import { useStake } from "../hooks/useStake.js";
import { useWrongNetwork } from "../hooks/useWrongNetwork.js";
import { AmountField } from "./AmountField.js";
import { ValidatorSelect } from "./ValidatorSelect.js";
import { Summary, SummaryRow } from "./Summary.js";
import { Button } from "./ui/button.js";

export interface PanelProps {
  state: StakeViewState;
  symbol: string;
  decimals: number;
}

const dayCount = (sec: bigint) => Number(sec / 86_400n);

/** Parse a user-entered amount into base units; invalid/empty input → `0n`. */
export function parseAmount(value: string, decimals: number): bigint {
  try {
    return value ? parseUnits(value, decimals) : 0n;
  } catch {
    return 0n;
  }
}

/** Stake flow → `token.approve` (only if the allowance is short) then
 *  `staking.stake(validator, amount)`, both via `useStake`. */
export function StakePanel({ state, symbol, decimals }: PanelProps) {
  const [amount, setAmount] = useState("");
  const {
    connected,
    walletBalance,
    validators,
    selectedValidator,
    selectValidator,
    withdrawDelaySec,
  } = state;

  const { data: allowance } = useSafeAllowance();
  const { mutate: stake, isPending, step, error } = useStake();

  const wrongNetwork = useWrongNetwork();

  const amountWei = parseAmount(amount, decimals);
  const hasAmount = amountWei > 0n;
  const insufficient = amountWei > walletBalance;
  const needsApproval = allowance !== undefined && allowance < amountWei;
  const pretty = hasAmount ? Number(amount).toLocaleString("en-US") : "0.00";

  // `label` and `canSubmit` are derived from the same cascade: the button only
  // submits in the final two (ready) branches, gated on a selected validator
  // and no in-flight tx; every earlier branch is a blocked state.
  let label: string;
  let canSubmit: boolean;
  if (!connected) {
    label = "Connect to stake";
    canSubmit = false;
  } else if (wrongNetwork) {
    label = "Wrong Network";
    canSubmit = false;
  } else if (step === "approving") {
    label = "Approving…";
    canSubmit = false;
  } else if (step === "staking") {
    label = "Staking…";
    canSubmit = false;
  } else if (!hasAmount) {
    label = "Enter an amount";
    canSubmit = false;
  } else if (insufficient) {
    label = "Insufficient balance";
    canSubmit = false;
  } else if (needsApproval) {
    label = `Approve & Stake ${pretty} ${symbol}`;
    canSubmit = selectedValidator !== undefined && !isPending;
  } else {
    label = `Stake ${pretty} ${symbol}`;
    canSubmit = selectedValidator !== undefined && !isPending;
  }

  const submit = () => {
    if (!selectedValidator || !canSubmit) return;
    stake(
      { validator: selectedValidator.address, amount: amountWei },
      { onSuccess: () => setAmount("") },
    );
  };

  return (
    <div className="ss:animate-rise">
      <AmountField
        label="Stake amount"
        value={amount}
        onChange={setAmount}
        available={walletBalance}
        availableLabel="Balance"
        symbol={symbol}
        decimals={decimals}
        disabled={!connected || isPending}
      />

      <ValidatorSelect
        validators={validators}
        value={selectedValidator?.address}
        onValueChange={selectValidator}
        symbol={symbol}
        decimals={decimals}
        disabled={!connected || isPending}
      />

      <Summary>
        <SummaryRow label="Unbonding period">{dayCount(withdrawDelaySec)} days</SummaryRow>
        <SummaryRow label="You will stake">
          {pretty} {symbol}
        </SummaryRow>
      </Summary>

      <Button size="lg" className="ss:mt-4 ss:w-full" disabled={!canSubmit} onClick={submit}>
        {label}
      </Button>

      {error && (
        <p className="ss:mt-2 ss:text-center ss:text-xs ss:text-error" role="alert">
          Transaction failed. Please try again.
        </p>
      )}
    </div>
  );
}
