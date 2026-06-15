import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseEther, type Address } from "viem";
import { StakePanel } from "./StakePanel.js";
import type { StakeViewState } from "../hooks/useStakeData.js";

const VALIDATOR = "0x3D58a5475c1336b0A755c3aBd298CeB9b7BB9CDe" as Address;
const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address;

// The flow hooks are exercised in their own suites; here we stub them to drive
// the panel's button copy / submit wiring deterministically.
const stakeMutate = vi.fn();
let stakeReturn: { mutate: typeof stakeMutate; isPending: boolean; step: string; error: unknown };
let allowance: bigint | undefined;
vi.mock("../hooks/useStake.js", () => ({ useStake: () => stakeReturn }));
vi.mock("../hooks/useSafeAllowance.js", () => ({ useSafeAllowance: () => ({ data: allowance }) }));

const validator = { address: VALIDATOR, name: "Gnosis", totalStaked: parseEther("100") };

function baseState(overrides: Partial<StakeViewState> = {}): StakeViewState {
  return {
    connected: true,
    account: ACCOUNT,
    walletBalance: parseEther("100"),
    stakedBalance: 0n,
    withdrawals: [],
    validators: [validator],
    selectedValidator: validator,
    withdrawDelaySec: 604_800n,
    selectValidator: vi.fn(),
    ...overrides,
  };
}

function renderPanel(state: StakeViewState) {
  return render(<StakePanel state={state} symbol="SAFE" decimals={18} />);
}

describe("StakePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stakeReturn = { mutate: stakeMutate, isPending: false, step: "idle", error: null };
    allowance = 0n;
  });

  it("prompts to connect (disabled) while disconnected", () => {
    renderPanel(baseState({ connected: false }));
    const button = screen.getByRole("button", { name: "Connect to stake" });
    expect(button).toHaveProperty("disabled", true);
  });

  it("asks for an amount before one is entered", () => {
    renderPanel(baseState());
    expect(screen.getByRole("button", { name: "Enter an amount" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("offers Approve & Stake when the allowance is short", async () => {
    const user = userEvent.setup();
    allowance = 0n;
    renderPanel(baseState());
    await user.type(screen.getByLabelText("Stake amount"), "50");
    expect(screen.getByRole("button", { name: "Approve & Stake 50 SAFE" })).toBeDefined();
  });

  it("offers a plain Stake when the allowance already covers the amount", async () => {
    const user = userEvent.setup();
    allowance = parseEther("1000");
    renderPanel(baseState());
    await user.type(screen.getByLabelText("Stake amount"), "50");
    expect(screen.getByRole("button", { name: "Stake 50 SAFE" })).toBeDefined();
  });

  it("blocks an amount above the wallet balance", async () => {
    const user = userEvent.setup();
    renderPanel(baseState({ walletBalance: parseEther("10") }));
    await user.type(screen.getByLabelText("Stake amount"), "50");
    expect(screen.getByRole("button", { name: "Insufficient balance" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("submits the parsed amount and selected validator", async () => {
    const user = userEvent.setup();
    allowance = parseEther("1000");
    renderPanel(baseState());
    await user.type(screen.getByLabelText("Stake amount"), "50");
    await user.click(screen.getByRole("button", { name: "Stake 50 SAFE" }));

    expect(stakeMutate).toHaveBeenCalledWith(
      { validator: VALIDATOR, amount: parseEther("50") },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("reflects the in-flight tx in the button copy", () => {
    stakeReturn = { mutate: stakeMutate, isPending: true, step: "approving", error: null };
    renderPanel(baseState());
    expect(screen.getByRole("button", { name: "Approving…" })).toHaveProperty("disabled", true);

    stakeReturn = { mutate: stakeMutate, isPending: true, step: "staking", error: null };
    renderPanel(baseState());
    expect(screen.getByRole("button", { name: "Staking…" })).toBeDefined();
  });

  it("shows an alert when the flow errors", () => {
    stakeReturn = { mutate: stakeMutate, isPending: false, step: "idle", error: new Error("boom") };
    renderPanel(baseState());
    expect(screen.getByRole("alert")).toBeDefined();
  });
});
