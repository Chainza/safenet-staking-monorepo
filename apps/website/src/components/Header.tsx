import { useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Link, NavLink } from "react-router";
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

const menuNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-[var(--page-fg)] text-[var(--page-bg)]"
      : "text-[var(--page-muted)] hover:text-[var(--page-fg)]"
  }`;

const iconButtonClass =
  "grid size-10 cursor-pointer place-items-center rounded-full border border-[var(--page-border)] text-[var(--page-fg)] transition-colors hover:bg-[var(--page-muted)]/10";

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

/**
 * Page header: the Safe mark on the left, the primary navigation centered on
 * the screen, and the wallet + theme controls on the right. The navigation
 * only renders while a wallet is connected — the Activity page is
 * wallet-scoped (it redirects to Stake otherwise). Below the `xs` breakpoint
 * (600px) the nav and wallet control collapse into a single burger menu;
 * the theme switcher stays inline, left of the burger button.
 */
export function Header({ theme, onToggleTheme }: HeaderProps) {
  const { isConnected } = useConnection();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = theme === "dark";
  const themeBtnTitle = `Switch to ${isDark ? "light" : "dark"} theme`;
  const ThemeBtnIcon = isDark ? Sun : Moon;
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="relative flex items-center justify-between border-b border-[var(--page-border)] px-4 py-4">
      <Link to="/" aria-label="Home" className="rounded-full">
        <SafeLogo className="size-10" />
      </Link>

      {/* ≥ xs: centered nav (on the viewport, not between the flex siblings). */}
      {isConnected && (
        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--page-border)] bg-[var(--page-bg)] p-1 xs:flex"
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
        {/* ≥ xs only — on mobile the wallet control moves into the burger menu. */}
        <div className="hidden xs:block">
          <WalletControl />
        </div>

        {/* The theme switcher stays inline at every width. */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={themeBtnTitle}
          title={themeBtnTitle}
          className={iconButtonClass}
        >
          <ThemeBtnIcon className="size-4" />
        </button>

        {/* < xs: the nav + wallet control collapse into one burger button. */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="header-menu"
          className={`${iconButtonClass} xs:hidden`}
        >
          {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {menuOpen && (
        <div
          id="header-menu"
          className="absolute inset-x-4 top-full z-50 mt-2 flex flex-col gap-3 rounded-2xl border border-[var(--page-border)] bg-[var(--page-bg)] p-4 shadow-lg xs:hidden"
        >
          {isConnected && (
            <nav aria-label="Primary" className="flex flex-col gap-1">
              <NavLink to="/" end className={menuNavLinkClass} onClick={closeMenu}>
                Stake
              </NavLink>
              <NavLink to="/activity" className={menuNavLinkClass} onClick={closeMenu}>
                Activity
              </NavLink>
            </nav>
          )}

          <WalletControl menuAlign="left" />
        </div>
      )}
    </header>
  );
}
