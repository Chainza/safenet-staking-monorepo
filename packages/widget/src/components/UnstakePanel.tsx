import { useState } from "react";
import { Clock } from "lucide-react";
import { useUnstake } from "../hooks/useUnstake.js";
import { useWrongNetwork } from "../hooks/useWrongNetwork.js";
import { AmountField } from "./AmountField.js";
import { ValidatorSelect } from "./ValidatorSelect.js";
import { Summary, SummaryRow } from "./Summary.js";
import { Button } from "./ui/button.js";
import { parseAmount, type PanelProps } from "./StakePanel.js";

const dayCount = (sec: bigint) => Number(sec / 86_400n);

/** Unstake flow → `staking.initiateWithdrawal(validator, amount)` via `useUnstake`;
 *  tokens then sit in the withdrawal queue until the unbonding delay clears. */
export function UnstakePanel({ state, symbol, decimals }: PanelProps) {
  const [amount, setAmount] = useState("");
  const {
    connected,
    stakedBalance,
    validators,
    selectedValidator,
    selectValidator,
    withdrawDelaySec,
  } = state;

  const wrongNetwork = useWrongNetwork();
  const { mutate: unstake, isPending, error } = useUnstake();

  const amountWei = parseAmount(amount, decimals);
  const hasAmount = amountWei > 0n;
  const insufficient = amountWei > stakedBalance;
  const pretty = hasAmount ? Number(amount).toLocaleString("en-US") : "0.00";

  let label: string;
  let canSubmit: boolean;
  if (!connected) {
    label = "Connect to unstake";
    canSubmit = false;
  } else if (wrongNetwork) {
    label = "Wrong Network";
    canSubmit = false;
  } else if (isPending) {
    label = "Unstaking…";
    canSubmit = false;
  } else if (!hasAmount) {
    label = "Enter an amount";
    canSubmit = false;
  } else if (insufficient) {
    label = "Insufficient staked";
    canSubmit = false;
  } else {
    label = `Unstake ${pretty} ${symbol}`;
    canSubmit = selectedValidator !== undefined;
  }

  const submit = () => {
    if (!selectedValidator || !canSubmit) return;
    unstake(
      { validator: selectedValidator.address, amount: amountWei },
      { onSuccess: () => setAmount("") },
    );
  };

  return (
    <div className="ss:animate-rise">
      <AmountField
        label="Unstake amount"
        value={amount}
        onChange={setAmount}
        available={stakedBalance}
        availableLabel="Staked"
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
          {pretty} {symbol}
        </SummaryRow>
      </Summary>

      <Button
        variant="outline"
        size="lg"
        className="ss:mt-4 ss:w-full"
        disabled={!canSubmit}
        onClick={submit}
      >
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
