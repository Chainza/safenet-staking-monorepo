import "./styles.css";
import type { StakingConfig } from "safe-stake-core";

export type WidgetTheme = "light" | "dark";
export type WidgetMode = "standalone" | "inherit";

export interface WidgetProps {
  /** Visual theme. Defaults to "light". */
  theme?: WidgetTheme;
  /**
   * Wallet integration mode. "standalone" manages its own wagmi config and
   * connection UI; "inherit" consumes the host app's existing wagmi context.
   * Defaults to "standalone".
   */
  mode?: WidgetMode;
  /** Staking contract configuration passed through to safe-stake-core. */
  config?: StakingConfig;
}

export function Widget({ theme = "light", mode = "standalone" }: WidgetProps) {
  return (
    <div className="ss:rounded-lg ss:border ss:p-4" data-theme={theme} data-mode={mode}>
      <p className="ss:text-sm ss:font-medium">SAFE Stake Widget</p>
      <p className="ss:text-xs ss:opacity-70">
        theme: {theme} · mode: {mode}
      </p>
    </div>
  );
}
