import "./styles.css";
import { useConnection } from "wagmi";
import { WidgetProviders } from "./providers/WidgetProviders.js";
import { useWidgetStore, type TabKey, type WidgetMode } from "./store.js";
import { useStakeData, type StakeViewState } from "./hooks/useStakeData.js";
import { useSafeTokenMeta } from "./hooks/useSafeTokenMeta.js";
import { Header } from "./components/Header.js";
import { Card } from "./components/ui/card.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs.js";
import { StakePanel } from "./components/StakePanel.js";
import { UnstakePanel } from "./components/UnstakePanel.js";
import { ClaimPanel } from "./components/ClaimPanel.js";

export type WidgetTheme = "light" | "dark";
export type { WidgetMode } from "./store.js";

export interface WidgetProps {
  /** Visual theme. Defaults to "dark". */
  theme?: WidgetTheme;
  /**
   * Wallet integration mode. "auto" (default) detects a host `WagmiProvider`
   * and reuses it, falling back to the widget's own config when none is found.
   * "standalone" always mounts the widget's own config; "inherit" always
   * consumes the host's (and errors if absent).
   */
  mode?: WidgetMode;
  /**
   * WalletConnect Cloud project id, enabling the WalletConnect connector in
   * standalone mode. Without it, standalone offers the injected connector only.
   */
  walletConnectProjectId?: string;
}

export function Widget({ theme = "dark", mode = "auto", walletConnectProjectId }: WidgetProps) {
  return (
    <WidgetProviders mode={mode} walletConnectProjectId={walletConnectProjectId}>
      <WidgetInner theme={theme} />
    </WidgetProviders>
  );
}

/** Inner tree — always rendered inside the wagmi + query-client providers, so
 *  it's safe to call wagmi hooks here. */
function WidgetInner({ theme }: { theme: WidgetTheme }) {
  const tab = useWidgetStore((s) => s.tab);
  const setTab = useWidgetStore((s) => s.setTab);
  const resolvedMode = useWidgetStore((s) => s.resolvedMode);
  const { address, isConnected } = useConnection();
  const data = useStakeData();
  // `data` is non-nullable — the hook seeds the SAFE fallback as `initialData`.
  const {
    data: { symbol, decimals },
  } = useSafeTokenMeta();

  const state: StakeViewState = { connected: isConnected, account: address ?? null, ...data };

  return (
    <div
      className="safe-stake ss:w-full ss:max-w-[400px] ss:mx-auto ss:font-display ss:text-foreground ss:antialiased"
      data-theme={theme}
      data-mode={resolvedMode}
    >
      <Card className="ss:rounded-[20px] ss:p-5 ss:animate-rise">
        <Header />

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList>
            <TabsTrigger value="stake">stake</TabsTrigger>
            <TabsTrigger value="unstake">unstake</TabsTrigger>
            <TabsTrigger value="claim">claim</TabsTrigger>
          </TabsList>
          <TabsContent value="stake">
            <StakePanel state={state} symbol={symbol} decimals={decimals} />
          </TabsContent>
          <TabsContent value="unstake">
            <UnstakePanel state={state} symbol={symbol} decimals={decimals} />
          </TabsContent>
          <TabsContent value="claim">
            <ClaimPanel state={state} symbol={symbol} decimals={decimals} />
          </TabsContent>
        </Tabs>

        <div className="ss:flex ss:items-center ss:justify-center ss:gap-2 ss:mt-4 ss:font-mono ss:text-[10px] ss:tracking-wide ss:text-muted-foreground">
          <span>SAFENET</span>
          <span className="ss:size-0.5 ss:rounded-full ss:bg-muted-foreground" aria-hidden />
          <span>Non-custodial</span>
          <span className="ss:size-0.5 ss:rounded-full ss:bg-muted-foreground" aria-hidden />
          <span>{data.validators.length} validators</span>
        </div>
      </Card>
    </div>
  );
}
