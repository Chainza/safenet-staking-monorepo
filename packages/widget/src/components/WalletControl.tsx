import { useState } from "react";
import { useConnect, useConnection, useConnectors, useDisconnect, type Connector } from "wagmi";
import { Button } from "./ui/button.js";
import { Card } from "./ui/card.js";
import { truncateAddress } from "../lib/format.js";
import { logger } from "../lib/logger.js";
import { useWidgetStore } from "../store.js";

/** Friendlier display label for a connector — the generic injected connector
 *  reads "Injected" by default, which we surface as "Browser Wallet". */
function connectorLabel(connector: Connector): string {
  return connector.id === "injected" ? "Browser Wallet" : connector.name;
}

/**
 * Connect / disconnect control, built directly on wagmi hooks against the
 * active config. Rendered only in standalone mode — in inherit mode the host
 * owns connection UI, so this returns null (the widget still reads the host's
 * account via `useConnection`).
 *
 * The connector picker and account menu render inline (not portaled) so they
 * stay inside the `.safe-stake` themed scope.
 */
export function WalletControl() {
  const mode = useWidgetStore((s) => s.resolvedMode);
  // wagmi v3: useConnection replaces the deprecated useAccount; the mutation
  // hooks' named aliases are deprecated, so use `mutate` and useConnectors().
  const { address, isConnected } = useConnection();
  const connectors = useConnectors();
  const { mutate: connect, isPending } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (mode === "inherit") return null;

  if (!isConnected) {
    const onConnect = (connector: Connector) => {
      connect({ connector }, { onError: (e) => logger.error("wallet connect failed", e) });
      setOpen(false);
    };
    // A single connector connects directly; multiple reveal an inline picker.
    const single = connectors.length === 1 ? connectors[0] : undefined;

    return (
      <div className="ss:relative">
        <Button
          size="sm"
          className="ss:rounded-full"
          disabled={isPending || connectors.length === 0}
          onClick={() => (single ? onConnect(single) : setOpen((v) => !v))}
        >
          {isPending ? "Connecting…" : "Connect Wallet"}
        </Button>

        {open && !single && (
          <Card className="ss:absolute ss:right-0 ss:mt-2 ss:z-10 ss:w-48 ss:p-2 ss:flex ss:flex-col ss:gap-1 ss:animate-rise">
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                variant="ghost"
                size="sm"
                className="ss:justify-start"
                onClick={() => onConnect(connector)}
              >
                {connectorLabel(connector)}
              </Button>
            ))}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="ss:relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="ss:rounded-full ss:font-mono ss:font-medium"
      >
        <span className="ss:size-2 ss:rounded-full ss:bg-primary" aria-hidden />
        {address && truncateAddress(address)}
      </Button>

      {open && (
        <Card className="ss:absolute ss:right-0 ss:mt-2 ss:z-10 ss:w-40 ss:p-2 ss:animate-rise">
          <Button
            variant="ghost"
            size="sm"
            className="ss:w-full ss:justify-start"
            onClick={() => {
              disconnect(undefined);
              setOpen(false);
            }}
          >
            Disconnect
          </Button>
        </Card>
      )}
    </div>
  );
}
