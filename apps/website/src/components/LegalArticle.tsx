import { useEffect, type ReactNode } from "react";

export interface LegalArticleProps {
  title: string;
  /** Human-readable revision date, e.g. "4 August 2026". */
  updated: string;
  /** Small caps line above the title. */
  eyebrow?: string;
  children: ReactNode;
}

/**
 * Shared shell for the footer-reached article pages (imprint, terms, privacy,
 * developer docs): eyebrow, title, revision date, prose sections. Those routes
 * are reached from the footer — i.e. with the page scrolled to the bottom — so
 * the article resets the scroll position on mount.
 */
export function LegalArticle({
  title,
  updated,
  eyebrow = "SAFENET · LEGAL",
  children,
}: LegalArticleProps) {
  // Block body on purpose: a concise arrow would return scrollTo's result,
  // and patched environments (e.g. smooth-scroll extensions) make that a
  // Promise — which React would treat as a broken clean-up function.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <article className="w-full max-w-[720px]">
      <span className="font-mono text-xs tracking-[0.22em] text-[var(--page-accent)]">
        {eyebrow}
      </span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 font-mono text-xs text-[var(--page-muted)]">Last updated: {updated}</p>
      <div className="mt-10 flex flex-col gap-10">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-3 text-sm text-[var(--page-muted)]">{children}</div>
    </section>
  );
}

/** External reference inside legal prose — a new tab, except mailto links
 *  (a mail client isn't a tab). */
export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  const isMail = href.startsWith("mailto:");
  return (
    <a
      href={href}
      target={isMail ? undefined : "_blank"}
      rel={isMail ? undefined : "noreferrer"}
      className="font-medium text-[var(--page-fg)] underline decoration-[var(--page-border)] underline-offset-4 transition-colors hover:decoration-[var(--page-accent)]"
    >
      {children}
    </a>
  );
}
