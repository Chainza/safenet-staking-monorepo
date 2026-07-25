import { Navigate } from "react-router";
import { useConnection } from "wagmi";
import { TransactionHistory } from "../components/TransactionHistory.js";

/** Activity page: the connected account's staking transaction history. */
export function ActivityPage() {
  const { isDisconnected } = useConnection();

  // The page is wallet-scoped: without a wallet, back to Stake. Keyed on
  // `isDisconnected` (not `!isConnected`) so wagmi's async reconnect on page
  // load doesn't bounce a connected user off a deep link while it resolves.
  if (isDisconnected) return <Navigate to="/" replace />;

  return (
    <>
      <section className="max-w-[540px] text-center">
        <span className="font-mono text-xs tracking-[0.22em] text-[var(--page-accent)]">
          SAFENET · ACTIVITY
        </span>
      </section>

      <TransactionHistory />
    </>
  );
}
