/**
 * Current wall-clock time in ms.
 *
 * `"use no memo"` opts the hook out of React Compiler memoization so it
 * re-evaluates `Date.now()` on every render instead of freezing to the first
 * value. No interval/subscription — countdowns refresh whenever the widget
 * re-renders.
 */
export function useDateNow(): number {
  "use no memo";
  return Date.now();
}
