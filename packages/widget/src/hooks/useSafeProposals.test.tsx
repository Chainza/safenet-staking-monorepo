import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWidgetStore, type SafeProposal } from "../store.js";
import { useSafeProposal, useSafeProposals } from "./useSafeProposals.js";

const SAFE = "0xA21E80bd9dc6a2f501D5b3DF527eA0884Ef11De4" as const;
const OTHER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

// The connection is driven by these two values; the store stays real.
let address: string | undefined;
let chainId: number;
vi.mock("wagmi", () => ({
  useConnection: () => ({ address }),
  useChainId: () => chainId,
}));

function proposal(overrides: Partial<SafeProposal>): SafeProposal {
  return { id: "0x01", flow: "stake", account: SAFE, chainId: 1, status: "pending", ...overrides };
}

describe("useSafeProposals", () => {
  beforeEach(() => {
    address = SAFE;
    chainId = 1;
    useWidgetStore.setState({ safeProposals: [] });
  });

  it("returns only the connected account's proposals on the active chain", () => {
    useWidgetStore.setState({
      safeProposals: [
        proposal({ id: "0x01" }),
        proposal({ id: "0x02", account: OTHER }),
        proposal({ id: "0x03", chainId: 11_155_111 }),
        proposal({ id: "0x04", account: SAFE.toLowerCase() as typeof SAFE }),
      ],
    });

    const ids = renderHook(() => useSafeProposals()).result.current.map((p) => p.id);
    expect(ids).toEqual(["0x01", "0x04"]);
  });

  it("returns nothing while disconnected", () => {
    useWidgetStore.setState({ safeProposals: [proposal({})] });
    address = undefined;

    expect(renderHook(() => useSafeProposals()).result.current).toEqual([]);
  });
});

describe("useSafeProposal", () => {
  beforeEach(() => {
    address = SAFE;
    chainId = 1;
  });

  it("prefers the flow's pending proposal over an older failed one", () => {
    useWidgetStore.setState({
      safeProposals: [
        proposal({ id: "0x01", flow: "claim", status: "failed" }),
        proposal({ id: "0x02", flow: "claim" }),
        proposal({ id: "0x03", flow: "stake" }),
      ],
    });

    expect(renderHook(() => useSafeProposal("claim")).result.current?.id).toBe("0x02");
  });

  it("falls back to the flow's latest failed proposal", () => {
    useWidgetStore.setState({
      safeProposals: [proposal({ id: "0x01", flow: "rewards", status: "failed" })],
    });

    expect(renderHook(() => useSafeProposal("rewards")).result.current?.status).toBe("failed");
  });

  it("is undefined when the flow has no proposal", () => {
    useWidgetStore.setState({ safeProposals: [proposal({ flow: "stake" })] });

    expect(renderHook(() => useSafeProposal("unstake")).result.current).toBeUndefined();
  });
});
