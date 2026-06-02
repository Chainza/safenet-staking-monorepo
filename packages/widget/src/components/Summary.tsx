import type { ReactNode } from "react";
import { Card } from "./ui/card.js";

/** Dashed-border container for the per-flow summary rows. */
export function Summary({ children }: { children: ReactNode }) {
  return <Card className="ss:mt-4 ss:border-dashed ss:bg-transparent ss:px-4">{children}</Card>;
}

export interface SummaryRowProps {
  label: ReactNode;
  children: ReactNode;
  /** Render the value in the accent color (e.g. APR). */
  accent?: boolean;
}

export function SummaryRow({ label, children, accent }: SummaryRowProps) {
  return (
    <div className="ss:flex ss:items-center ss:justify-between ss:py-2 ss:text-sm ss:[&:not(:first-child)]:border-t ss:[&:not(:first-child)]:border-border">
      <span className="ss:text-muted-foreground">{label}</span>
      <span className={`ss:font-mono ss:font-medium ${accent ? "ss:text-accent-strong" : ""}`}>
        {children}
      </span>
    </div>
  );
}
