import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { parseEther } from "viem";
import { ValidatorSelect } from "./ValidatorSelect.js";
import type { Validator } from "../hooks/useValidators.js";

const VALIDATORS: Validator[] = [
  {
    address: "0x3D58a5475c1336b0A755c3aBd298CeB9b7BB9CDe",
    name: "Gnosis",
    totalStaked: parseEther("100"),
  },
  {
    address: "0x7B0A8EFA45dE81F11F2846EC28259B62155a2b37",
    name: "Greenfield",
    totalStaked: parseEther("50"),
  },
];

describe("ValidatorSelect", () => {
  it("shows the selected validator's name, address and stake in the trigger", () => {
    render(
      <ValidatorSelect
        validators={VALIDATORS}
        value={VALIDATORS[1]!.address}
        onValueChange={vi.fn()}
        symbol="SAFE"
        decimals={18}
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "Validator" });
    expect(trigger.textContent).toContain("Greenfield");
    expect(trigger.textContent).toContain("0x7B0A…2b37".slice(0, 6)); // truncated address prefix
    expect(trigger.textContent).toContain("50");
  });

  it("falls back to the first validator when the value is unknown", () => {
    render(
      <ValidatorSelect
        validators={VALIDATORS}
        value={undefined}
        onValueChange={vi.fn()}
        symbol="SAFE"
        decimals={18}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Validator" }).textContent).toContain("Gnosis");
  });

  it("renders a loading placeholder while the validator set is empty", () => {
    render(
      <ValidatorSelect
        validators={[]}
        value={undefined}
        onValueChange={vi.fn()}
        symbol="SAFE"
        decimals={18}
      />,
    );
    expect(screen.getByText(/Loading validators/)).toBeDefined();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
