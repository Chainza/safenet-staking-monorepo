import type { KeyboardEvent } from "react";
import { formatUnits } from "viem";
import { formatToken } from "../lib/format.js";
import { Card } from "./ui/card.js";
import { Input } from "./ui/input.js";
import { Button } from "./ui/button.js";
import { Badge } from "./ui/badge.js";
import { SafeTokenIcon } from "./SafeTokenIcon.js";

export interface AmountFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Available balance (base units) shown as the "Balance" affordance + MAX. */
  available: bigint;
  availableLabel: string;
  symbol: string;
  /** Token decimals — scales `available` for display and MAX. */
  decimals: number;
  disabled?: boolean;
}

/** Big numeric amount input with token chip, balance readout and MAX. */
export function AmountField({
  label,
  value,
  onChange,
  available,
  availableLabel,
  symbol,
  decimals,
  disabled,
}: AmountFieldProps) {
  // Emit the *exact* balance (full precision), not the 2-decimal display value —
  // rounding the display up would push the parsed amount above the real balance
  // and trip the "Insufficient balance" guard.
  const setMax = () => onChange(formatUnits(available, decimals));

  // An amount is a non-negative decimal, so the sign and exponent characters a
  // number input otherwise accepts can never form a valid value here — block
  // them at the keystroke.
  const blockNonAmountKeys = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
  };

  return (
    <Card
      data-disabled={disabled ? "true" : "false"}
      className="ss:bg-background ss:p-4 ss:transition ss:focus-within:border-primary ss:focus-within:ring-2 ss:focus-within:ring-ring/15 ss:data-[disabled=true]:opacity-45 ss:data-[disabled=true]:pointer-events-none"
    >
      <div className="ss:flex ss:items-center ss:justify-between ss:mb-2 ss:font-mono ss:text-xs">
        <span className="ss:uppercase ss:tracking-wider ss:text-muted-foreground">{label}</span>
        <span className="ss:text-muted-foreground">
          {availableLabel}{" "}
          <b className="ss:text-foreground ss:font-medium">{formatToken(available, decimals)}</b>{" "}
          {symbol}
        </span>
      </div>
      <div className="ss:flex ss:items-center ss:gap-2">
        <Input
          className="ss:font-mono ss:text-3xl ss:font-medium ss:tracking-tight"
          inputMode="decimal"
          type="number"
          min={0}
          placeholder="0.00"
          aria-label={label}
          value={value}
          disabled={disabled}
          onKeyDown={blockNonAmountKeys}
          // The keystroke guard can't cover paste/drop/autofill, so negative
          // values are dropped here too — 0 is the smallest allowed amount.
          onChange={(e) => {
            if (!e.target.value.includes("-")) onChange(e.target.value);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={setMax}
          disabled={disabled}
          className="ss:px-2 ss:font-mono ss:text-accent-strong"
        >
          MAX
        </Button>
        <Badge variant="secondary" className="ss:h-8 ss:px-2 ss:text-sm ss:font-semibold">
          <SafeTokenIcon className="ss:size-4" />
          {symbol}
        </Badge>
      </div>
    </Card>
  );
}
