import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

const FOOTER_LINKS = [
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

const linkClass =
  "flex items-center gap-1 text-sm font-medium text-[var(--page-muted)] transition-colors hover:text-[var(--page-fg)]";

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
        <Link key={to} to={to} className={linkClass}>
          {label}
        </Link>
      ))}
    </footer>
  );
}
