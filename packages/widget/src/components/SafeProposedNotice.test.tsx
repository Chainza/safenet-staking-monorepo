import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SafeProposedNotice } from "./SafeProposedNotice.js";

describe("SafeProposedNotice", () => {
  it("tells the user the tx is queued in their Safe once a flow ends `proposed`", () => {
    render(<SafeProposedNotice outcome={{ status: "proposed", safeTxHash: "0xsafe" }} />);

    const text = screen.getByRole("status").textContent;
    expect(text).toMatch(/queued in your safe/i);
    expect(text).toContain("Safe{Wallet}");
  });

  it("renders nothing before a flow ends", () => {
    const { container } = render(<SafeProposedNotice outcome={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing for a confirmed on-chain tx", () => {
    const { container } = render(
      <SafeProposedNotice outcome={{ status: "confirmed", hash: "0xabc" }} />,
    );
    expect(container.innerHTML).toBe("");
  });
});
