import { useState } from "react";
import { useConnect, useConnection, useConnectors, useDisconnect, type Connector } from "wagmi";

/** Friendlier label — the generic injected connector reads "Injected". */
function connectorLabel(connector: Connector): string {
  return connector.id === "injected" ? "Browser Wallet" : connector.name;
}

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const buttonClass =
  "cursor-pointer rounded-full border border-[var(--page-border)] px-4 py-2 text-sm font-medium text-[var(--page-fg)] transition-colors hover:bg-[var(--page-muted)]/10";
const menuClass =
  "absolute right-0 mt-2 z-10 flex w-48 flex-col gap-1 rounded-xl border border-[var(--page-border)] bg-[var(--page-bg)] p-2 shadow-lg";
const itemClass =
  "cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-[var(--page-fg)] transition-colors hover:bg-[var(--page-muted)]/10";

/**
 * The website's own connect / disconnect control, built directly on wagmi hooks.
 * The widget runs in inherit mode here (it reuses this host config), so the host
 * owns the connection UI — this is it.
 */
export function WalletControl() {
  // wagmi v3: useConnection replaces useAccount; use the mutations' `mutate`.
  const { address, isConnected } = useConnection();
  const connectors = useConnectors();
  const { mutate: connect, isPending } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (!isConnected) {
    const onConnect = (connector: Connector) => {
      connect(
        { connector },
        { onError: (e) => console.error("[website] wallet connect failed", e) },
      );
      setOpen(false);
    };
    const single = connectors.length === 1 ? connectors[0] : undefined;

    return (
      <div className="relative">
        <button
          type="button"
          className={buttonClass}
          disabled={isPending || connectors.length === 0}
          onClick={() => (single ? onConnect(single) : setOpen((v) => !v))}
        >
          {isPending ? "Connecting…" : "Connect Wallet"}
        </button>

        {open && !single && (
          <div className={menuClass}>
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                type="button"
                className={itemClass}
                onClick={() => onConnect(connector)}
              >
                {connectorLabel(connector)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={`${buttonClass} font-mono`}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="mr-2 inline-block size-2 rounded-full bg-[var(--page-accent)]"
          aria-hidden
        />
        {address && truncate(address)}
      </button>

      {open && (
        <div className={menuClass}>
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              disconnect(undefined);
              setOpen(false);
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
