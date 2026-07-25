import { Moon, Sun } from "lucide-react";
import { NavLink } from "react-router";
import { useConnection } from "wagmi";
import type { Theme } from "../theme.js";
import { WalletControl } from "../WalletControl.js";
import { SafeLogo } from "./SafeLogo.js";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-[var(--page-fg)] text-[var(--page-bg)]"
      : "text-[var(--page-muted)] hover:text-[var(--page-fg)]"
  }`;

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

/**
 * Fixed page header: the Safe mark on the left, the primary navigation
 * centered on the screen, and the wallet + theme controls on the right.
 * The navigation only renders while a wallet is connected — the Activity
 * page is wallet-scoped (it redirects to Stake otherwise).
 */
export function Header({ theme, onToggleTheme }: HeaderProps) {
  const { isConnected } = useConnection();
  const isDark = theme === "dark";
  const themeBtnTitle = `Switch to ${isDark ? "light" : "dark"} theme`;
  const ThemeBtnIcon = isDark ? Sun : Moon;

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-4">
      <SafeLogo className="size-10" />

      {/* Centered on the viewport, not between the flex siblings. */}
      {isConnected && (
        <nav
          aria-label="Primary"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--page-border)] bg-[var(--page-bg)] p-1"
        >
          <NavLink to="/" end className={navLinkClass}>
            Stake
          </NavLink>
          <NavLink to="/activity" className={navLinkClass}>
            Activity
          </NavLink>
        </nav>
      )}

      <div className="flex items-center gap-2">
        <WalletControl />
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={themeBtnTitle}
          title={themeBtnTitle}
          className="grid size-10 cursor-pointer place-items-center rounded-full border border-[var(--page-border)] text-[var(--page-fg)] transition-colors hover:bg-[var(--page-muted)]/10"
        >
          <ThemeBtnIcon className="size-4" />
        </button>
      </div>
    </header>
  );
}
