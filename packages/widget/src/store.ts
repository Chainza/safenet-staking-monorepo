import { create } from "zustand";
import { isAddressEqual, type Address } from "viem";

/** The widget's `mode` prop: `"auto"` detects a host wagmi provider and reuses
 *  it (else standalone); `"standalone"`/`"inherit"` force one or the other. */
export type WidgetMode = "auto" | "standalone" | "inherit";

/** The integration mode after detection: whether the widget mounted its own
 *  wagmi stack ("standalone") or is reusing the host's ("inherit"). */
export type ResolvedMode = "standalone" | "inherit";

/** The active flow tab. */
export type TabKey = "stake" | "unstake" | "claim" | "rewards";

/** A write flow — one per tab. */
export type WriteFlow = TabKey;

/**
 * A Safe transaction a write flow proposed (EIP-5792 `wallet_sendCalls`) and
 * the widget is waiting on until the Safe executes it (see
 * `SafeProposalWatchers`). Scoped to the account + chain that proposed it.
 */
export interface SafeProposal {
  /** The call-bundle id `wallet_sendCalls` returned — the Safe's `safeTxHash`. */
  id: string;
  flow: WriteFlow;
  account: Address;
  chainId: number;
  /** `pending` until the Safe executes it; `failed` once it failed or was cancelled. */
  status: "pending" | "failed";
}

/** Whether two proposals belong to the same flow, account and chain. */
function sameScope(a: Omit<SafeProposal, "id" | "status">, b: Omit<SafeProposal, "id" | "status">) {
  return a.flow === b.flow && a.chainId === b.chainId && isAddressEqual(a.account, b.account);
}

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
  /** Safe transactions proposed by this page and not yet executed (or failed). */
  safeProposals: SafeProposal[];
  /** Track a new pending proposal; it supersedes an earlier *failed* one of the
   *  same flow/account/chain (whose notice it replaces). */
  addSafeProposal: (proposal: Omit<SafeProposal, "status">) => void;
  /** The Safe reported the proposal failed or was cancelled. */
  failSafeProposal: (id: string) => void;
  /** The proposal executed (and its reads were refreshed) — stop tracking it. */
  removeSafeProposal: (id: string) => void;
}

/**
 * Module-global widget store. Replaces per-value React contexts and holds the
 * widget's shared UI state (resolved mode, active tab, validator selection,
 * pending Safe proposals — which must outlive a panel's tab),
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
  safeProposals: [],
  addSafeProposal: (proposal) =>
    set((s) => ({
      safeProposals: [
        ...s.safeProposals.filter((p) => !(p.status === "failed" && sameScope(p, proposal))),
        { ...proposal, status: "pending" },
      ],
    })),
  failSafeProposal: (id) =>
    set((s) => ({
      safeProposals: s.safeProposals.map((p) => (p.id === id ? { ...p, status: "failed" } : p)),
    })),
  removeSafeProposal: (id) =>
    set((s) => ({ safeProposals: s.safeProposals.filter((p) => p.id !== id) })),
}));
