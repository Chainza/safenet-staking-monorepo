import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Tailwind runs with `prefix(ss)`, so tailwind-merge must know the prefix to
// dedupe conflicting utilities (e.g. ss:p-0 overriding ss:px-3) correctly.
const twMerge = extendTailwindMerge({ prefix: "ss" });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
