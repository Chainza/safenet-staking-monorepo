import "./styles.css";
import { useState } from "react";
import type { SafeStakeConfigInput } from "safe-stake-core";
import { useStakeDemo } from "./hooks/useStakeDemo.js";
import { Header } from "./components/Header.js";
import { Card } from "./components/ui/card.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs.js";
import { StakePanel } from "./components/StakePanel.js";
import { UnstakePanel } from "./components/UnstakePanel.js";
import { ClaimPanel } from "./components/ClaimPanel.js";

export type WidgetTheme = "light" | "dark";
export type WidgetMode = "standalone" | "inherit";
type TabKey = "stake" | "unstake" | "claim";

/** Token symbol shown throughout — resolved from `token.getSymbol()` once wired. */
const SYMBOL = "SAFE";

export interface WidgetProps {
  /** Visual theme. Defaults to "dark". */
  theme?: WidgetTheme;
  /**
   * Wallet integration mode. "standalone" manages its own wagmi config and
   * connection UI; "inherit" consumes the host app's existing wagmi context.
   * Defaults to "standalone".
   */
  mode?: WidgetMode;
  /** Staking contract configuration passed through to safe-stake-core. */
  config?: SafeStakeConfigInput;
}

export function Widget({ theme = "dark", mode = "standalone" }: WidgetProps) {
  const [tab, setTab] = useState<TabKey>("stake");
  const demo = useStakeDemo();

  return (
    <div
      className="safe-stake ss:w-full ss:max-w-[400px] ss:mx-auto ss:font-display ss:text-foreground ss:antialiased"
      data-theme={theme}
      data-mode={mode}
    >
      <Card className="ss:rounded-[20px] ss:p-5 ss:animate-rise">
        <Header
          account={demo.account}
          onConnect={demo.connect}
          onDisconnect={demo.disconnect}
          showConnect={mode === "standalone"}
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList>
            <TabsTrigger value="stake">stake</TabsTrigger>
            <TabsTrigger value="unstake">unstake</TabsTrigger>
            <TabsTrigger value="claim">claim</TabsTrigger>
          </TabsList>
          <TabsContent value="stake">
            <StakePanel state={demo} symbol={SYMBOL} />
          </TabsContent>
          <TabsContent value="unstake">
            <UnstakePanel state={demo} symbol={SYMBOL} />
          </TabsContent>
          <TabsContent value="claim">
            <ClaimPanel state={demo} symbol={SYMBOL} />
          </TabsContent>
        </Tabs>

        <div className="ss:flex ss:items-center ss:justify-center ss:gap-2 ss:mt-4 ss:font-mono ss:text-[10px] ss:tracking-wide ss:text-muted-foreground">
          <span>SAFENET</span>
          <span className="ss:size-0.5 ss:rounded-full ss:bg-muted-foreground" aria-hidden />
          <span>Non-custodial</span>
          <span className="ss:size-0.5 ss:rounded-full ss:bg-muted-foreground" aria-hidden />
          <span>{demo.validators.length} validators</span>
        </div>
      </Card>
    </div>
  );
}
