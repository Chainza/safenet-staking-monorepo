import { ShieldCheck } from "lucide-react";
import { WalletControl } from "./WalletControl.js";

export function Header() {
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

      <WalletControl />
    </header>
  );
}
