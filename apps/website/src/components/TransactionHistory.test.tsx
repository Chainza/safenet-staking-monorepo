import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { TransactionHistory } from "./TransactionHistory.js";
import type { StakerTransactions } from "../hooks/useStakerTransactions.js";
import { WagmiHarness, mainnetConfig, TEST_ADDRESS } from "../test/wagmi.js";

// Stub the data hook: the query itself is covered by
// useStakerTransactions.test.tsx — under test here is the state rendering
// (disconnected / loading / error / rows).
let query: { data: StakerTransactions | undefined; isPending: boolean; isError: boolean };
vi.mock("../hooks/useStakerTransactions.js", () => ({
  useStakerTransactions: () => query,
}));

const STAKER = TEST_ADDRESS.toLowerCase() as StakerTransactions["staker"];
const STAKE_TX = "0x1111111111111111111111111111111111111111111111111111111111111111" as const;
const UNSTAKE_TX = "0x2222222222222222222222222222222222222222222222222222222222222222" as const;

const HISTORY: StakerTransactions = {
  staker: STAKER,
  limit: 10,
  offset: 0,
  stakeIncreaseds: [
    {
      id: "0xaaa-1",
      staker: STAKER,
      validator: "0x3d58a5475c1336b0a755c3abd298ceb9b7bb9cde",
      amount: "1000000000000000000",
      blockNumber: "23000001",
      blockTimestamp: "1750000000",
      transactionHash: STAKE_TX,
    },
  ],
  withdrawalInitiateds: [
    {
      id: "0xbbb-1",
      staker: STAKER,
      validator: "0x3d58a5475c1336b0a755c3abd298ceb9b7bb9cde",
      amount: "250000000000000000",
      withdrawalId: "7",
      blockNumber: "23000002",
      blockTimestamp: "1750000100",
      transactionHash: UNSTAKE_TX,
    },
  ],
  withdrawalClaimeds: [],
};

const EMPTY: StakerTransactions = {
  ...HISTORY,
  stakeIncreaseds: [],
  withdrawalInitiateds: [],
};

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

describe("TransactionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query = { data: HISTORY, isPending: false, isError: false };
  });

  it("renders nothing while disconnected", () => {
    render(<TransactionHistory />, { wrapper: wrapper(false) });
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("TRANSACTION HISTORY")).toBeNull();
  });

  it("renders skeleton rows while the query loads", async () => {
    query = { data: undefined, isPending: true, isError: false };
    const { container } = render(<TransactionHistory />, { wrapper: wrapper(true) });

    // The mock connector connects asynchronously — wait for the table.
    await screen.findByRole("table");
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows an alert instead of the table when the query errors", async () => {
    query = { data: undefined, isPending: false, isError: true };
    render(<TransactionHistory />, { wrapper: wrapper(true) });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Something went wrong.");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("renders merged rows newest-first with amount, action and explorer link", async () => {
    render(<TransactionHistory />, { wrapper: wrapper(true) });

    // Header row + 2 data rows; the later Unstake event sorts above the Stake.
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(3));
    const rows = screen.getAllByRole("row");
    expect(rows[1]!.textContent).toContain("Unstake");
    expect(rows[1]!.textContent).toContain("0.25 SAFE");
    expect(rows[2]!.textContent).toContain("Stake");
    expect(rows[2]!.textContent).toContain("1.00 SAFE");

    const links = screen.getAllByRole("link") as HTMLAnchorElement[];
    expect(links.map((link) => link.href)).toEqual([
      `https://etherscan.io/tx/${UNSTAKE_TX}`,
      `https://etherscan.io/tx/${STAKE_TX}`,
    ]);
    expect(links[0]!.target).toBe("_blank");
  });

  it("shows an empty state when the account has no history", async () => {
    query = { data: EMPTY, isPending: false, isError: false };
    render(<TransactionHistory />, { wrapper: wrapper(true) });

    expect(await screen.findByText("No transactions yet")).toBeDefined();
  });
});
