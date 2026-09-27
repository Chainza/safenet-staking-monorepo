import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWidgetStore, type SafeProposal } from "../store.js";
import { SAFE_STATUS_POLL_MS, SafeProposalWatchers } from "./SafeProposalWatchers.js";

const SAFE = "0xA21E80bd9dc6a2f501D5b3DF527eA0884Ef11De4" as const;
const OTHER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
const EXEC_HASH = `0x${"e0".repeat(32)}`;

// wagmi's two waiting hooks are stubbed per test; the store, the effect and the
// invalidations stay real.
let callsStatus: { status: string; receipts?: { transactionHash: string }[] } | undefined;
let receipt: { isPending: boolean };
const useWaitForCallsStatus = vi.fn<(args: unknown) => { data: typeof callsStatus }>(() => ({
  data: callsStatus,
}));
const useWaitForTransactionReceipt = vi.fn<(args: unknown) => typeof receipt>(() => receipt);
vi.mock("wagmi", () => ({
  useConnection: () => ({ address: SAFE }),
  useChainId: () => 1,
  useWaitForCallsStatus: (args: unknown) => useWaitForCallsStatus(args),
  useWaitForTransactionReceipt: (args: unknown) => useWaitForTransactionReceipt(args),
}));
vi.mock("../lib/logger.js", () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

function proposal(overrides: Partial<SafeProposal> = {}): SafeProposal {
  return { id: "0x01", flow: "claim", account: SAFE, chainId: 1, status: "pending", ...overrides };
}
const proposals = () => useWidgetStore.getState().safeProposals;

describe("SafeProposalWatchers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
    callsStatus = undefined;
    receipt = { isPending: true };
    useWidgetStore.setState({ safeProposals: [proposal()] });
  });

  it("waits on each pending proposal with no timeout and indefinite retries", () => {
    render(<SafeProposalWatchers />, { wrapper });

    expect(useWaitForCallsStatus).toHaveBeenCalledWith({
      id: "0x01",
      timeout: 0,
      pollingInterval: SAFE_STATUS_POLL_MS,
      query: { retry: true, retryDelay: SAFE_STATUS_POLL_MS },
    });
  });

  it("watches only the connected account's pending proposals", () => {
    useWidgetStore.setState({
      safeProposals: [
        proposal({ id: "0x01" }),
        proposal({ id: "0x02", status: "failed" }),
        proposal({ id: "0x03", account: OTHER }),
      ],
    });
    render(<SafeProposalWatchers />, { wrapper });

    const ids = useWaitForCallsStatus.mock.calls.map((c) => (c[0] as { id: string }).id);
    expect(new Set(ids)).toEqual(new Set(["0x01"]));
  });

  it("keeps the proposal pending while the Safe hasn't executed it", () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    render(<SafeProposalWatchers />, { wrapper });

    expect(proposals()).toEqual([proposal()]);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("waits for the execution receipt on our RPC before refreshing", () => {
    callsStatus = { status: "success", receipts: [{ transactionHash: EXEC_HASH }] };
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    render(<SafeProposalWatchers />, { wrapper });

    expect(useWaitForTransactionReceipt).toHaveBeenCalledWith({ hash: EXEC_HASH, chainId: 1 });
    expect(proposals()).toHaveLength(1);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("refreshes the flow's reads and drops the proposal once executed and mined", async () => {
    callsStatus = { status: "success", receipts: [{ transactionHash: EXEC_HASH }] };
    receipt = { isPending: false };
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    render(<SafeProposalWatchers />, { wrapper });

    await waitFor(() => expect(proposals()).toEqual([]));
    const keys = invalidate.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(["safe-stake", "withdrawals", 1, SAFE]);
    expect(keys).toContainEqual(["safe-stake", "balance", 1, SAFE]);
  });

  it("settles without waiting on a receipt when the Safe reports none", async () => {
    callsStatus = { status: "success", receipts: [] };
    render(<SafeProposalWatchers />, { wrapper });

    await waitFor(() => expect(proposals()).toEqual([]));
    expect(useWaitForTransactionReceipt).toHaveBeenCalledWith({ hash: undefined, chainId: 1 });
  });

  it("marks a failed or cancelled Safe transaction failed, refreshing nothing", async () => {
    callsStatus = { status: "failure" };
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    render(<SafeProposalWatchers />, { wrapper });

    await waitFor(() => expect(proposals()).toEqual([proposal({ status: "failed" })]));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
