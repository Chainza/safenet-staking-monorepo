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
  const setMax = () => onChange(formatToken(available, decimals, 2).replace(/,/g, ""));

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
          placeholder="0.00"
          aria-label={label}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
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
