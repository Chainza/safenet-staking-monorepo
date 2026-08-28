import type { SVGProps } from "react";

/**
 * Original Safenet-staking brand mark: three ascending bars (stake accruing)
 * on the accent-green disc — the same glyph the widget uses for SAFE amounts
 * and the favicon repeats. Deliberately our own artwork: the milestone
 * agreement does not license the official Safe logo. Self-colored, so it reads
 * on both themes; size it via `className`. Exposed as an image named
 * "Safenet Staking" (it's the header brand mark, not decoration) — override
 * through props where it is purely decorative.
 */
export function BrandLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Safenet Staking"
      {...props}
    >
      <rect width="32" height="32" rx="16" fill="#12FF80" />
      <rect x="8" y="17" width="4.5" height="7.5" rx="2.25" fill="#04140B" />
      <rect x="13.75" y="13" width="4.5" height="11.5" rx="2.25" fill="#04140B" />
      <rect x="19.5" y="9" width="4.5" height="15.5" rx="2.25" fill="#04140B" />
    </svg>
  );
}
