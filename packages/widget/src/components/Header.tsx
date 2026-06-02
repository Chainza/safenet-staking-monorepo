import { ShieldCheck } from "lucide-react";
import { Button } from "./ui/button.js";
import { truncateAddress } from "../lib/format.js";
import type { Address } from "safe-stake-core";

export interface HeaderProps {
  account: Address | null;
  onConnect: () => void;
  onDisconnect: () => void;
  /** Whether the widget renders its own connection control ("standalone"). */
  showConnect: boolean;
}

export function Header({ account, onConnect, onDisconnect, showConnect }: HeaderProps) {
  return (
    <header className="ss:flex ss:items-center ss:justify-between ss:mb-6">
      <div className="ss:flex ss:items-center ss:gap-2">
        <span
          className="ss:grid ss:place-items-center ss:size-8 ss:rounded-lg ss:bg-primary ss:text-primary-foreground"
          aria-hidden
        >
          <ShieldCheck className="ss:size-4" />
        </span>
        <span className="ss:text-base ss:font-semibold ss:tracking-tight">
          SAFE <span className="ss:text-muted-foreground ss:font-medium">Stake</span>
        </span>
      </div>

      {showConnect &&
        (account ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            className="ss:rounded-full ss:font-mono ss:font-medium"
          >
            <span className="ss:size-2 ss:rounded-full ss:bg-primary" aria-hidden />
            {truncateAddress(account)}
          </Button>
        ) : (
          <Button size="sm" onClick={onConnect} className="ss:rounded-full">
            Connect Wallet
          </Button>
        ))}
    </header>
  );
}
