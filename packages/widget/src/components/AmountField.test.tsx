import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { parseEther } from "viem";
import { AmountField } from "./AmountField.js";

const baseProps = {
  label: "Stake amount",
  value: "",
  available: parseEther("12480.42"),
  availableLabel: "Balance",
  symbol: "SAFE",
  decimals: 18,
};

describe("AmountField", () => {
  it("shows the formatted available balance", () => {
    render(<AmountField {...baseProps} onChange={() => {}} />);
    expect(screen.getByText("12,480.42")).toBeDefined();
  });

  it("emits typed input through onChange", () => {
    const onChange = vi.fn();
    render(<AmountField {...baseProps} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Stake amount"), { target: { value: "100" } });
    expect(onChange).toHaveBeenCalledWith("100");
  });

  it("MAX emits the full available balance without grouping commas", () => {
    const onChange = vi.fn();
    render(<AmountField {...baseProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("MAX"));
    expect(onChange).toHaveBeenCalledWith("12480.42");
  });

  it("scales the available balance by the token decimals", () => {
    // 6-decimal token: the same base-units value formats to a smaller amount.
    render(
      <AmountField {...baseProps} decimals={6} available={123_456_000n} onChange={() => {}} />,
    );
    expect(screen.getByText("123.46")).toBeDefined();
  });

  it("disables the input and MAX when disabled", () => {
    render(<AmountField {...baseProps} onChange={() => {}} disabled />);
    expect((screen.getByLabelText("Stake amount") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByText("MAX") as HTMLButtonElement).disabled).toBe(true);
  });
});
