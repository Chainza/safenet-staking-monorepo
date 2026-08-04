import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { TransactionHistory } from "./TransactionHistory.js";
import type { StakeIncreasedEvent, StakerTransactions } from "../hooks/useStakerTransactions.js";
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

/** 12 stake events, oldest first by index — two pages of 10 + 2. */
const MANY_STAKES: StakeIncreasedEvent[] = Array.from({ length: 12 }, (_, i) => ({
  id: `0xaaa-${i}`,
  staker: STAKER,
  validator: "0x3d58a5475c1336b0a755c3abd298ceb9b7bb9cde",
  amount: (BigInt(i + 1) * 10n ** 18n).toString(),
  blockNumber: `${23000000 + i}`,
  blockTimestamp: `${1750000000 + i}`,
  transactionHash: STAKE_TX,
}));

const PAGED: StakerTransactions = { ...EMPTY, stakeIncreaseds: MANY_STAKES };

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

  it("hides the pagination controls when everything fits one page", async () => {
    render(<TransactionHistory />, { wrapper: wrapper(true) });

    await screen.findByRole("table");
    expect(screen.queryByRole("button", { name: "Next page" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Previous page" })).toBeNull();
  });

  it("paginates newest-first, 10 rows per page", async () => {
    query = { data: PAGED, isPending: false, isError: false };
    const user = userEvent.setup();
    render(<TransactionHistory />, { wrapper: wrapper(true) });

    // Header row + the first 10 of 12 rows; newest (12 SAFE) on top.
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(11));
    expect(screen.getAllByRole("row")[1]!.textContent).toContain("12.00 SAFE");
    expect(screen.getByText("1 / 2")).toBeDefined();

    const prev = screen.getByRole("button", { name: "Previous page" }) as HTMLButtonElement;
    const next = screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    await user.click(next);

    // The two oldest rows remain; the boundaries flip.
    expect(screen.getByText("2 / 2")).toBeDefined();
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(rows[1]!.textContent).toContain("2.00 SAFE");
    expect(rows[2]!.textContent).toContain("1.00 SAFE");
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(true);

    await user.click(prev);
    expect(screen.getByText("1 / 2")).toBeDefined();
    expect(screen.getAllByRole("row")).toHaveLength(11);
  });
});
