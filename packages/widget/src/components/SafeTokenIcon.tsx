import type { SVGProps } from "react";

/**
 * Original token glyph for SAFE amounts: three ascending bars (stake accruing)
 * on the accent-green disc. Deliberately our own artwork — the milestone
 * agreement does not license the official Safe logo, so none of it is vendored
 * here. Self-colored, so it reads on both themes; size it via `className`
 * (e.g. `ss:size-4`). Decorative by default (`aria-hidden`), which a caller
 * can override through props.
 */
export function SafeTokenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <rect width="32" height="32" rx="16" fill="#12FF80" />
      <rect x="8" y="17" width="4.5" height="7.5" rx="2.25" fill="#04140B" />
      <rect x="13.75" y="13" width="4.5" height="11.5" rx="2.25" fill="#04140B" />
      <rect x="19.5" y="9" width="4.5" height="15.5" rx="2.25" fill="#04140B" />
    </svg>
  );
}
