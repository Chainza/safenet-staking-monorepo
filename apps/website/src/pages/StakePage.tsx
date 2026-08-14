import { Widget } from "@chainza/safenet-staking-widget";
import type { Theme } from "../theme.js";

/** Home page: the hero copy and the staking widget. */
export function StakePage({ theme }: { theme: Theme }) {
  return (
    <>
      <section className="max-w-[540px] text-center">
        <span className="font-mono text-xs tracking-[0.22em] text-[var(--page-accent)]">
          SAFENET · STAKING
        </span>
        <h1 className="mt-4 text-[clamp(24px,4vw,36px)] font-bold tracking-tight">
          Stake SAFE.
          <br />
          Secure the network.
        </h1>
      </section>

      {/* Default mode="auto": the widget detects the host WagmiProvider above
          and runs in inherit mode, reusing this app's wallet connection. */}
      <Widget theme={theme} />
    </>
  );
}
