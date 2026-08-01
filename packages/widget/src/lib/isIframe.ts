/**
 * True when running embedded in an iframe — the context Safe{Wallet} runs Safe
 * Apps in. Uses the same check as wagmi's `safe` connector so the connector is
 * offered exactly when it can actually produce a provider.
 */
export function isIframe(): boolean {
  return typeof window !== "undefined" && window.parent !== window;
}
