import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useConnection } from "wagmi";
import { mainnet } from "wagmi/chains";
import type { Hash } from "viem";
import { useStakerTransactions, type StakerTransactions } from "../hooks/useStakerTransactions.js";
import { formatToken, truncateHash } from "../lib/format.js";
import { Skeleton } from "./ui/skeleton.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.js";

/** Rows per page. */
const PAGE_SIZE = 10;

/** Per-list `limit` requested from the Indexer API — its cap. The API pages
 *  each event list independently by offset, which can't express a page of the
 *  *merged* newest-first rows, so we fetch the full window once and paginate
 *  client-side. */
const FETCH_LIMIT = 200;

const EXPLORER_TX_URL = `${mainnet.blockExplorers.default.url}/tx`;

/** The staked token's display meta. The staking widget reads this on-chain;
 *  for the page-level history table the SAFE constants are enough. */
const TOKEN = { symbol: "SAFE", decimals: 18 } as const;

const pageBtnClass =
  "grid size-8 cursor-pointer place-items-center rounded-full border border-[var(--page-border)] text-[var(--page-fg)] transition-colors hover:bg-[var(--page-muted)]/10 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent";

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
  ].sort((a, b) => b.timestampMs - a.timestampMs);
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
 * table: date, action, amount and an explorer-linked tx hash, paginated
 * `PAGE_SIZE` rows at a time. A page companion to the widget, themed with the
 * page tokens. Renders nothing while disconnected, skeleton rows while
 * loading, and an inline alert on error.
 */
export function TransactionHistory() {
  const { isConnected } = useConnection();
  const { data, isPending, isError } = useStakerTransactions({ limit: FETCH_LIMIT });
  const [page, setPage] = useState(0);

  if (!isConnected) return null;

  const rows = data === undefined ? [] : toRows(data);
  // Derived clamp (not an effect): a refetch may shrink the row set while a
  // later page is open.
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <section className="w-full max-w-[640px] rounded-[20px] border border-[var(--page-border)] p-6">
      <h2 className="mb-3 font-mono text-[10px] tracking-[0.22em] text-[var(--page-muted)]">
        TRANSACTION HISTORY
      </h2>

      {isError ? (
        <p className="py-2 text-center text-xs text-red-500" role="alert">
          Something went wrong.
        </p>
      ) : (
        <>
          <Table className="[&_td]:py-3 [&_th]:h-10">
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
                [0, 1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    {[0, 1, 2, 3].map((j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-4 text-center text-[var(--page-muted)]">
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
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

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                className={pageBtnClass}
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="font-mono text-xs text-[var(--page-muted)]">
                {currentPage + 1} / {pageCount}
              </span>
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
                className={pageBtnClass}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
