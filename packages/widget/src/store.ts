import { create } from "zustand";
import type { Address } from "viem";

/** The integration mode after detection: whether the widget mounted its own
 *  wagmi stack ("standalone") or is reusing the host's ("inherit"). */
export type ResolvedMode = "standalone" | "inherit";

/** The active flow tab. */
export type TabKey = "stake" | "unstake" | "claim";

interface WidgetStore {
  /** Set by `WidgetProviders` once the host contexts have been probed. */
  resolvedMode: ResolvedMode;
  setResolvedMode: (resolvedMode: ResolvedMode) => void;
  /** Active flow tab. */
  tab: TabKey;
  setTab: (tab: TabKey) => void;
  /** Selected validator address; `null` falls back to the first validator. */
  selectedValidator: Address | null;
  selectValidator: (address: Address) => void;
}

/**
 * Module-global widget store. Replaces per-value React contexts and holds the
 * widget's shared UI state (resolved mode, active tab, validator selection),
 * read via selectors (`useWidgetStore(s => s.x)`) so nothing has to be drilled.
 * Global by design — same trade-off as the `standaloneConfig` / `queryClient`
 * singletons, so it assumes a single `<Widget />` per page. Transient,
 * component-local state (form inputs, dropdown open flags) stays in `useState`.
 */
export const useWidgetStore = create<WidgetStore>((set) => ({
  resolvedMode: "standalone",
  setResolvedMode: (resolvedMode) => set({ resolvedMode }),
  tab: "stake",
  setTab: (tab) => set({ tab }),
  selectedValidator: null,
  selectValidator: (selectedValidator) => set({ selectedValidator }),
}));
