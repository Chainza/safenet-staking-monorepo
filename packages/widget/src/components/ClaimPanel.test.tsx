import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseEther, type Address } from "viem";
import { ClaimPanel } from "./ClaimPanel.js";
import type { StakeViewState } from "../hooks/useStakeData.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address;

// The flow hook is exercised in its own suite; here we stub it to drive the
// panel's button copy / submit wiring deterministically.
const claimMutate = vi.fn();
let claimReturn: { mutate: typeof claimMutate; isPending: boolean; error: unknown };
vi.mock("../hooks/useClaim.js", () => ({ useClaim: () => claimReturn }));

// Freeze "now" so countdowns are deterministic (ms; claimableAt is unix seconds).
vi.mock("../hooks/useDateNow.js", () => ({ useDateNow: () => 1_000_000_000_000 }));

const matured = { amount: parseEther("750"), claimableAt: 1n }; // 1970 → ready
const unbonding = { amount: parseEther("250"), claimableAt: 2_000_000_000n }; // 2033 → counting down

function baseState(overrides: Partial<StakeViewState> = {}): StakeViewState {
  return {
    connected: true,
    account: ACCOUNT,
    walletBalance: parseEther("100"),
    stakedBalance: parseEther("80"),
    withdrawals: [],
    validators: [],
    selectedValidator: undefined,
    withdrawDelaySec: 604_800n,
    selectValidator: vi.fn(),
    ...overrides,
  };
}

function renderPanel(state: StakeViewState) {
  return render(<ClaimPanel state={state} symbol="SAFE" decimals={18} />);
}

describe("ClaimPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    claimReturn = { mutate: claimMutate, isPending: false, error: null };
  });

  it("prompts to connect while disconnected", () => {
    renderPanel(baseState({ connected: false }));
    expect(screen.getByText(/connect your wallet/i)).toBeDefined();
  });

  it("shows the empty state when there are no withdrawals", () => {
    renderPanel(baseState());
    expect(screen.getByText("No pending withdrawals")).toBeDefined();
  });

  it("enables a single 'Claim next' action when a row has matured", () => {
    renderPanel(baseState({ withdrawals: [matured, unbonding] }));
    expect(screen.getByRole("button", { name: "Claim next" })).toHaveProperty("disabled", false);
    expect(screen.getAllByText(/Unbonding/i).length).toBe(1);
  });

  it("disables the action (Nothing to claim yet) while everything is still unbonding", () => {
    renderPanel(baseState({ withdrawals: [unbonding] }));
    expect(screen.getByRole("button", { name: "Nothing to claim yet" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("claims the next matured withdrawal on click", async () => {
    const user = userEvent.setup();
    renderPanel(baseState({ withdrawals: [matured] }));
    await user.click(screen.getByRole("button", { name: "Claim next" }));
    expect(claimMutate).toHaveBeenCalledWith();
  });

  it("disables the action while a claim is in flight", () => {
    claimReturn = { mutate: claimMutate, isPending: true, error: null };
    renderPanel(baseState({ withdrawals: [matured] }));
    expect(screen.getByRole("button", { name: "Claiming…" })).toHaveProperty("disabled", true);
  });

  it("shows an alert when the flow errors", () => {
    claimReturn = { mutate: claimMutate, isPending: false, error: new Error("boom") };
    renderPanel(baseState({ withdrawals: [matured] }));
    expect(screen.getByRole("alert")).toBeDefined();
  });
});
