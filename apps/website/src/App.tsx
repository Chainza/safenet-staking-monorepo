import { Widget } from "safe-stake-widget";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-16">
      <section className="max-w-[540px] text-center">
        <span className="font-mono text-xs tracking-[0.22em] text-[#12ff80]">
          SAFENET · STAKING
        </span>
        <h1 className="mt-4 mb-4 text-[clamp(34px,6vw,52px)] font-bold tracking-tight">
          Stake SAFE.
          <br />
          Secure the network.
        </h1>
        <p className="mx-auto max-w-[460px] text-base text-[#9aa6a1]">
          Non-custodial staking for the SAFE token. Delegate to a validator, earn rewards, and
          unstake on your own terms — all from one drop-in widget.
        </p>
      </section>

      <Widget
        theme="dark"
        walletConnectProjectId={import.meta.env.VITE_WALLETCONNECT_PROJECT_ID}
      />
    </main>
  );
}
