import { useConnection } from "wagmi";
import { mainnet } from "wagmi/chains";
import type { Hash } from "viem";
import { useStakerTransactions, type StakerTransactions } from "../hooks/useStakerTransactions.js";
import { formatToken, truncateHash } from "../lib/format.js";
import { Skeleton } from "./ui/skeleton.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.js";

/** Rows shown — also the per-list `limit` requested from the Indexer API. */
const MAX_ROWS = 10;

const EXPLORER_TX_URL = `${mainnet.blockExplorers.default.url}/tx`;

/** The staked token's display meta. The staking widget reads this on-chain;
 *  for the page-level history table the SAFE constants are enough. */
const TOKEN = { symbol: "SAFE", decimals: 18 } as const;

interface HistoryRow {
  id: string;
  timestampMs: number;
  action: "Stake" | "Unstake" | "Claim";
  amount: bigint;
  transactionHash: Hash;
}

/** Merge the Indexer API's three per-event lists into one newest-first row
 *  set. Each list is already newest-first, but they must interleave. */
function toRows(history: StakerTransactions): HistoryRow[] {
  const row = (
    event: { id: string; blockTimestamp: string; amount: string; transactionHash: Hash },
    action: HistoryRow["action"],
  ): HistoryRow => ({
    // Ids are only unique per event type — prefix with the action.
    id: `${action}-${event.id}`,
    timestampMs: Number(event.blockTimestamp) * 1000,
    action,
    amount: BigInt(event.amount),
    transactionHash: event.transactionHash,
  });

  return [
    ...history.stakeIncreaseds.map((event) => row(event, "Stake")),
    ...history.withdrawalInitiateds.map((event) => row(event, "Unstake")),
    ...history.withdrawalClaimeds.map((event) => row(event, "Claim")),
  ]
    .sort((a, b) => b.timestampMs - a.timestampMs)
    .slice(0, MAX_ROWS);
}

function formatTimestamp(timestampMs: number): string {
  return new Date(timestampMs).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * The connected account's staking history (via `useStakerTransactions`) as a
 * compact table: date, action, amount and an explorer-linked tx hash. A page
 * companion to the widget, themed with the page tokens. Renders nothing while
 * disconnected, skeleton rows while loading, and an inline alert on error.
 */
export function TransactionHistory() {
  const { isConnected } = useConnection();
  const { data, isPending, isError } = useStakerTransactions({ limit: MAX_ROWS });

  if (!isConnected) return null;

  const rows = data === undefined ? [] : toRows(data);

  return (
    <section className="w-full max-w-[400px] rounded-[20px] border border-[var(--page-border)] p-5">
      <h2 className="mb-2 font-mono text-[10px] tracking-[0.22em] text-[var(--page-muted)]">
        TRANSACTION HISTORY
      </h2>

      {isError ? (
        <p className="py-2 text-center text-xs text-red-500" role="alert">
          Something went wrong.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Tx</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              [0, 1, 2].map((i) => (
                <TableRow key={i}>
                  {[0, 1, 2, 3].map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-4 text-center text-[var(--page-muted)]">
                  No transactions yet
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-[var(--page-muted)]">
                    {formatTimestamp(row.timestampMs)}
                  </TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatToken(row.amount, TOKEN.decimals)} {TOKEN.symbol}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <a
                      href={`${EXPLORER_TX_URL}/${row.transactionHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--page-accent)] hover:underline"
                    >
                      {truncateHash(row.transactionHash)}
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
