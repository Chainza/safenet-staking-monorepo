import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SafeProposal } from "../store.js";
import { SafeProposedNotice } from "./SafeProposedNotice.js";

const proposal: SafeProposal = {
  id: "0xsafe",
  flow: "stake",
  account: "0xA21E80bd9dc6a2f501D5b3DF527eA0884Ef11De4",
  chainId: 1,
  status: "pending",
};

describe("SafeProposedNotice", () => {
  it("tells the user a pending proposal is queued in their Safe", () => {
    render(<SafeProposedNotice proposal={proposal} />);

    const text = screen.getByRole("status").textContent;
    expect(text).toMatch(/queued in your safe/i);
    expect(text).toContain("Safe{Wallet}");
  });

  it("alerts that a failed or cancelled proposal moved nothing", () => {
    render(<SafeProposedNotice proposal={{ ...proposal, status: "failed" }} />);

    expect(screen.getByRole("alert").textContent).toMatch(/failed or was cancelled/i);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders nothing without a proposal", () => {
    const { container } = render(<SafeProposedNotice proposal={undefined} />);
    expect(container.innerHTML).toBe("");
  });
});
