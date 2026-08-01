import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseEther, type Address } from "viem";
import { RewardsPanel } from "./RewardsPanel.js";
import type { StakeViewState } from "../hooks/useStakeData.js";
import type { RewardProof } from "../hooks/useRewardProof.js";
import type { RewardsData } from "../hooks/useRewards.js";

const ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address;
const ROOT = `0x${"aa".repeat(32)}` as const;

// The flow hooks are exercised in their own suites; here we stub them to drive
// the panel's states deterministically.
let proof: RewardProof | null | undefined;
let rewards: RewardsData;
const claimMutate = vi.fn();
let claimReturn: { mutate: typeof claimMutate; isPending: boolean; error: unknown };
let wrongNetwork = false;

vi.mock("../hooks/useRewardProof.js", () => ({ useRewardProof: () => ({ data: proof }) }));
vi.mock("../hooks/useRewards.js", () => ({ useRewards: () => rewards }));
vi.mock("../hooks/useClaimRewards.js", () => ({ useClaimRewards: () => claimReturn }));
vi.mock("../hooks/useWrongNetwork.js", () => ({ useWrongNetwork: () => wrongNetwork }));

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

function renderPanel(state: StakeViewState = baseState()) {
  return render(<RewardsPanel state={state} symbol="SAFE" decimals={18} />);
}

describe("RewardsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wrongNetwork = false;
    proof = { cumulativeAmount: "1000", merkleRoot: ROOT, proof: [`0x${"bb".repeat(32)}`] };
    rewards = {
      claimable: parseEther("600"),
      totalClaimed: parseEther("400"),
      rootStale: false,
      canClaim: true,
    };
    claimReturn = { mutate: claimMutate, isPending: false, error: null };
  });

  it("prompts to connect while disconnected", () => {
    renderPanel(baseState({ connected: false }));
    expect(screen.getByText(/connect your wallet/i)).toBeDefined();
  });

  it("shows the empty state when the account has no reward proof", () => {
    proof = null;
    renderPanel();
    expect(screen.getByText("No rewards yet")).toBeDefined();
  });

  it("shows the claimable amount and total claimed, with the claim action enabled", () => {
    renderPanel();
    expect(screen.getByText("600.00")).toBeDefined();
    expect(screen.getByText(/400\.00 SAFE/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Claim rewards" })).toHaveProperty("disabled", false);
  });

  it("claims on click", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Claim rewards" }));
    expect(claimMutate).toHaveBeenCalledWith();
  });

  it("disables the action (Nothing to claim yet) without claimable rewards", () => {
    rewards = { ...rewards, claimable: 0n, canClaim: false };
    renderPanel();
    expect(screen.getByRole("button", { name: "Nothing to claim yet" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("blocks claiming while the on-chain root is ahead of the proof", () => {
    rewards = { ...rewards, rootStale: true, canClaim: false };
    renderPanel();
    expect(screen.getByRole("button", { name: "Rewards update in progress" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("blocks claiming on the wrong network", () => {
    wrongNetwork = true;
    renderPanel();
    expect(screen.getByRole("button", { name: "Wrong Network" })).toHaveProperty("disabled", true);
  });

  it("disables the action while a claim is in flight", () => {
    claimReturn = { mutate: claimMutate, isPending: true, error: null };
    renderPanel();
    expect(screen.getByRole("button", { name: "Claiming…" })).toHaveProperty("disabled", true);
  });

  it("notes rewards pending compliance checks", () => {
    proof = { ...proof!, kycAmount: "50", kyc: false };
    renderPanel();
    expect(screen.getByText(/pending compliance checks/i)).toBeDefined();
  });

  it("shows an alert when the flow errors", () => {
    claimReturn = { mutate: claimMutate, isPending: false, error: new Error("boom") };
    renderPanel();
    expect(screen.getByRole("alert")).toBeDefined();
  });
});
