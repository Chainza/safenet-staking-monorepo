import { beforeEach, describe, expect, it } from "vitest";
import { useWidgetStore, type SafeProposal } from "./store.js";

const SAFE = "0xA21E80bd9dc6a2f501D5b3DF527eA0884Ef11De4" as const;
const OTHER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

const base: Omit<SafeProposal, "status"> = { id: "0x01", flow: "claim", account: SAFE, chainId: 1 };
const proposals = () => useWidgetStore.getState().safeProposals;
const { addSafeProposal, failSafeProposal, removeSafeProposal } = useWidgetStore.getState();

describe("widget store — Safe proposals", () => {
  beforeEach(() => useWidgetStore.setState({ safeProposals: [] }));

  it("tracks a new proposal as pending", () => {
    addSafeProposal(base);
    expect(proposals()).toEqual([{ ...base, status: "pending" }]);
  });

  it("marks a proposal failed, then drops it on removal", () => {
    addSafeProposal(base);
    failSafeProposal("0x01");
    expect(proposals()).toEqual([{ ...base, status: "failed" }]);

    removeSafeProposal("0x01");
    expect(proposals()).toEqual([]);
  });

  it("replaces a failed proposal of the same flow/account/chain with the new attempt", () => {
    addSafeProposal(base);
    failSafeProposal("0x01");
    addSafeProposal({ ...base, id: "0x02", account: SAFE.toLowerCase() as typeof SAFE });

    expect(proposals().map((p) => [p.id, p.status])).toEqual([["0x02", "pending"]]);
  });

  it("keeps pending proposals and other scopes' failures", () => {
    addSafeProposal(base); // pending, same scope
    addSafeProposal({ ...base, id: "0x02", account: OTHER });
    failSafeProposal("0x02"); // failed, other account
    addSafeProposal({ ...base, id: "0x03", flow: "rewards" });
    failSafeProposal("0x03"); // failed, other flow

    addSafeProposal({ ...base, id: "0x04" });
    expect(proposals().map((p) => p.id)).toEqual(["0x01", "0x02", "0x03", "0x04"]);
  });
});
