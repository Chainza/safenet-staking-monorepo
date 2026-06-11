import type { Validator } from "../hooks/useValidators.js";
import { formatToken, truncateAddress } from "../lib/format.js";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select.js";
import type { Address } from "safe-stake-core";

export interface ValidatorSelectProps {
  validators: Validator[];
  /** `undefined` while the validator registry is still loading. */
  value: Address | undefined;
  onValueChange: (address: Address) => void;
  symbol: string;
  disabled?: boolean;
}

/** Validator picker backed by a shadcn Select over the live validator set. */
export function ValidatorSelect({
  validators,
  value,
  onValueChange,
  symbol,
  disabled,
}: ValidatorSelectProps) {
  const selected = validators.find((v) => v.address === value) ?? validators[0];

  // Registry still loading (or failed) — hold the trigger's footprint.
  if (selected === undefined) {
    return (
      <div className="ss:mt-2 ss:flex ss:min-h-14 ss:items-center ss:rounded-xl ss:border ss:border-border ss:bg-background ss:p-3 ss:text-sm ss:text-muted-foreground">
        Loading validators…
      </div>
    );
  }

  return (
    <Select
      value={selected.address}
      onValueChange={(v) => onValueChange(v as Address)}
      disabled={disabled}
    >
      <SelectTrigger className="ss:mt-2" aria-label="Validator">
        <span className="ss:flex ss:min-w-0 ss:items-center ss:gap-2">
          <span
            className="ss:grid ss:size-8 ss:shrink-0 ss:place-items-center ss:rounded-full ss:bg-accent/15 ss:text-xs ss:font-semibold ss:text-accent-strong"
            aria-hidden
          >
            {selected.name.charAt(0)}
          </span>
          <span className="ss:min-w-0">
            <span className="ss:block ss:text-sm ss:font-semibold">{selected.name}</span>
            <span className="ss:block ss:font-mono ss:text-xs ss:text-muted-foreground">
              {truncateAddress(selected.address)} · {formatToken(selected.totalStaked, 18, 0)}{" "}
              {symbol}
            </span>
          </span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {validators.map((v) => (
          <SelectItem key={v.address} value={v.address}>
            <span className="ss:flex ss:flex-col">
              <span className="ss:text-sm ss:font-semibold">{v.name}</span>
              <span className="ss:font-mono ss:text-xs ss:text-muted-foreground">
                {formatToken(v.totalStaked, 18, 0)} {symbol}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
