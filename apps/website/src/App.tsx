import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Widget } from "safe-stake-widget";
import { applyTheme, getInitialTheme, storeTheme, type Theme } from "./theme.js";
import { WalletControl } from "./WalletControl.js";

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

  const isDark = theme === "dark";
  const themeBtnTitle = `Switch to ${isDark ? "light" : "dark"} theme`;
  const ThemeBtnIcon = isDark ? Sun : Moon;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-16">
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <WalletControl />
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={themeBtnTitle}
          title={themeBtnTitle}
          className="grid size-10 cursor-pointer place-items-center rounded-full border border-[var(--page-border)] text-[var(--page-fg)] transition-colors hover:bg-[var(--page-muted)]/10"
        >
          <ThemeBtnIcon className="size-4" />
        </button>
      </div>

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
    </main>
  );
}
