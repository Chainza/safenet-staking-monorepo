import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseEther, type Address } from "viem";
import { UnstakePanel } from "./UnstakePanel.js";
import type { StakeViewState } from "../hooks/useStakeData.js";

const VALIDATOR = "0x3D58a5475c1336b0A755c3aBd298CeB9b7BB9CDe" as Address;
const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address;

// The flow hooks are exercised in their own suites; here we stub them to drive
// the panel's button copy / submit wiring deterministically.
const unstakeMutate = vi.fn();
let unstakeReturn: { mutate: typeof unstakeMutate; isPending: boolean; error: unknown };
vi.mock("../hooks/useUnstake.js", () => ({ useUnstake: () => unstakeReturn }));

let wrongNetwork = false;
vi.mock("../hooks/useWrongNetwork.js", () => ({ useWrongNetwork: () => wrongNetwork }));

const validator = { address: VALIDATOR, name: "Gnosis", totalStaked: parseEther("100") };

function baseState(overrides: Partial<StakeViewState> = {}): StakeViewState {
  return {
    connected: true,
    account: ACCOUNT,
    walletBalance: parseEther("100"),
    stakedBalance: parseEther("80"),
    withdrawals: [],
    validators: [validator],
    selectedValidator: validator,
    withdrawDelaySec: 604_800n,
    selectValidator: vi.fn(),
    ...overrides,
  };
}

function renderPanel(state: StakeViewState) {
  return render(<UnstakePanel state={state} symbol="SAFE" decimals={18} />);
}

describe("UnstakePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unstakeReturn = { mutate: unstakeMutate, isPending: false, error: null };
    wrongNetwork = false;
  });

  it("prompts to connect (disabled) while disconnected", () => {
    renderPanel(baseState({ connected: false }));
    expect(screen.getByRole("button", { name: "Connect to unstake" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("flags a wrong network (disabled) when the wallet chain differs from the app", () => {
    wrongNetwork = true;
    renderPanel(baseState());
    expect(screen.getByRole("button", { name: "Wrong Network" })).toHaveProperty("disabled", true);
  });

  it("asks for an amount before one is entered", () => {
    renderPanel(baseState());
    expect(screen.getByRole("button", { name: "Enter an amount" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("blocks an amount above the staked balance", async () => {
    const user = userEvent.setup();
    renderPanel(baseState({ stakedBalance: parseEther("10") }));
    await user.type(screen.getByLabelText("Unstake amount"), "50");
    expect(screen.getByRole("button", { name: "Insufficient staked" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("submits the parsed amount and selected validator", async () => {
    const user = userEvent.setup();
    renderPanel(baseState());
    await user.type(screen.getByLabelText("Unstake amount"), "50");
    await user.click(screen.getByRole("button", { name: "Unstake 50 SAFE" }));

    expect(unstakeMutate).toHaveBeenCalledWith(
      { validator: VALIDATOR, amount: parseEther("50") },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("reflects the in-flight tx in the button copy", () => {
    unstakeReturn = { mutate: unstakeMutate, isPending: true, error: null };
    renderPanel(baseState());
    expect(screen.getByRole("button", { name: "Unstaking…" })).toHaveProperty("disabled", true);
  });

  it("shows an alert when the flow errors", () => {
    unstakeReturn = { mutate: unstakeMutate, isPending: false, error: new Error("boom") };
    renderPanel(baseState());
    expect(screen.getByRole("alert")).toBeDefined();
  });
});
