import { useState } from "react";
import type { StakeViewState } from "../hooks/useStakeData.js";
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

/** Stake flow → `token.approve` (if needed) then `staking.stake(validator, amount)`. */
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
  const hasAmount = Number(amount) > 0;

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
        disabled={!connected}
      />

      <ValidatorSelect
        validators={validators}
        value={selectedValidator?.address}
        onValueChange={selectValidator}
        symbol={symbol}
        decimals={decimals}
        disabled={!connected}
      />

      <Summary>
        <SummaryRow label="Est. annual reward" accent>
          4.8% APR
        </SummaryRow>
        <SummaryRow label="Unbonding period">{dayCount(withdrawDelaySec)} days</SummaryRow>
        <SummaryRow label="You will stake">
          {hasAmount ? Number(amount).toLocaleString("en-US") : "0.00"} {symbol}
        </SummaryRow>
      </Summary>

      <Button size="lg" className="ss:mt-4 ss:w-full" disabled={!connected || !hasAmount}>
        {!connected
          ? "Connect to stake"
          : !hasAmount
            ? "Enter an amount"
            : `Stake ${Number(amount).toLocaleString("en-US")} ${symbol}`}
      </Button>
    </div>
  );
}
