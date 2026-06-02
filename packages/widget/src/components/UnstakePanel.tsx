import { useState } from "react";
import { Clock } from "lucide-react";
import { AmountField } from "./AmountField.js";
import { ValidatorSelect } from "./ValidatorSelect.js";
import { Summary, SummaryRow } from "./Summary.js";
import { Button } from "./ui/button.js";
import type { PanelProps } from "./StakePanel.js";

const dayCount = (sec: bigint) => Number(sec / 86_400n);

/** Unstake flow → `staking.initiateWithdrawal(validator, amount)`; tokens then
 *  sit in the withdrawal queue until the unbonding delay clears. */
export function UnstakePanel({ state, symbol }: PanelProps) {
  const [amount, setAmount] = useState("");
  const {
    connected,
    stakedBalance,
    validators,
    selectedValidator,
    selectValidator,
    withdrawDelaySec,
  } = state;
  const hasAmount = Number(amount) > 0;

  return (
    <div className="ss:animate-rise">
      <AmountField
        label="Unstake amount"
        value={amount}
        onChange={setAmount}
        available={stakedBalance}
        availableLabel="Staked"
        symbol={symbol}
        disabled={!connected}
      />

      <ValidatorSelect
        validators={validators}
        value={selectedValidator.address}
        onValueChange={selectValidator}
        symbol={symbol}
        disabled={!connected}
      />

      <Summary>
        <SummaryRow
          label={
            <span className="ss:inline-flex ss:items-center ss:gap-2">
              <Clock className="ss:size-4" />
              Claimable after
            </span>
          }
        >
          {dayCount(withdrawDelaySec)} days
        </SummaryRow>
        <SummaryRow label="You will unstake">
          {hasAmount ? Number(amount).toLocaleString("en-US") : "0.00"} {symbol}
        </SummaryRow>
      </Summary>

      <Button
        variant="outline"
        size="lg"
        className="ss:mt-4 ss:w-full"
        disabled={!connected || !hasAmount}
      >
        {!connected
          ? "Connect to unstake"
          : !hasAmount
            ? "Enter an amount"
            : `Unstake ${Number(amount).toLocaleString("en-US")} ${symbol}`}
      </Button>
    </div>
  );
}
