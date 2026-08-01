import { ArrowUpRight } from "lucide-react";

const SAFENET_EXPLORER_URL = "https://explorer.safenet-beta.eth.limo/";

/**
 * Page footer: external resources, for now just the Safenet Explorer link.
 * Mirrors the header's border/tone so the shell reads as one frame.
 */
export function Footer() {
  return (
    <footer className="flex items-center justify-center border-t border-[var(--page-border)] px-4 py-4">
      <a
        href={SAFENET_EXPLORER_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-sm font-medium text-[var(--page-muted)] transition-colors hover:text-[var(--page-fg)]"
      >
        Safenet Explorer
        <ArrowUpRight className="size-4" />
      </a>
    </footer>
  );
}
