import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Widget } from "safe-stake-widget";
import { applyTheme, getInitialTheme, storeTheme, type Theme } from "./theme.js";

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => applyTheme(theme), [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      storeTheme(next);
      return next;
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-16">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        className="fixed right-4 top-4 z-50 grid size-10 place-items-center rounded-full border border-[var(--page-border)] text-[var(--page-fg)] transition-colors hover:bg-[var(--page-muted)]/10"
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>

      <section className="max-w-[540px] text-center">
        <span className="font-mono text-xs tracking-[0.22em] text-[var(--page-accent)]">
          SAFENET · STAKING
        </span>
        <h1 className="mt-4 mb-4 text-[clamp(34px,6vw,52px)] font-bold tracking-tight">
          Stake SAFE.
          <br />
          Secure the network.
        </h1>
        <p className="mx-auto max-w-[460px] text-base text-[var(--page-muted)]">
          Non-custodial staking for the SAFE token. Delegate to a validator, earn rewards, and
          unstake on your own terms — all from one drop-in widget.
        </p>
      </section>

      <Widget theme={theme} walletConnectProjectId={import.meta.env.VITE_WALLETCONNECT_PROJECT_ID} />
    </main>
  );
}
