import { ArrowUpRight } from "lucide-react";
import { NavLink } from "react-router";

const FOOTER_LINKS = [
  // The canonical production deployment (IPFS + ENS) — kept visible from every
  // environment (staging included) so users can always reach the real thing.
  { label: "safenetstake.eth", href: "https://safenetstake.eth.limo/" },
  { label: "Safenet Explorer", href: "https://explorer.safenet-beta.eth.limo/" },
  { label: "FAQ", href: "https://docs.safefoundation.org/safenet/resources/faq" },
  { label: "Docs", href: "https://docs.safefoundation.org/safenet/overview/introduction" },
  { label: "Staking Risks", href: "https://docs.safefoundation.org/safenet/staking/risk" },
] as const;

/** Internal legal pages — routed, not external, hence no new tab / arrow. */
const LEGAL_LINKS = [
  { label: "Imprint", to: "/imprint" },
  { label: "Terms", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
] as const;

const linkBase = "flex items-center gap-1 text-sm font-medium transition-colors";

const linkClass = `${linkBase} text-[var(--page-muted)] hover:text-[var(--page-fg)]`;

/** The currently open legal page reads slightly stronger (fg, not muted). */
const legalLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${linkBase} text-[var(--page-fg)]` : linkClass;

/**
 * Page footer: external Safenet resources (explorer, FAQ, docs) plus the
 * operator's legal pages. Mirrors the header's border/tone so the shell reads
 * as one frame.
 */
export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-[var(--page-border)] px-4 py-4">
      {FOOTER_LINKS.map(({ label, href }) => (
        <a key={href} href={href} target="_blank" rel="noreferrer" className={linkClass}>
          {label}
          <ArrowUpRight className="size-4" />
        </a>
      ))}
      {LEGAL_LINKS.map(({ label, to }) => (
        <NavLink key={to} to={to} className={legalLinkClass}>
          {label}
        </NavLink>
      ))}
    </footer>
  );
}
