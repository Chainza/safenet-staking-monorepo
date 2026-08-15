import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import axios from "axios";
import type { Address, Hash } from "viem";
import { assert } from "ts-essentials";

/** Base URL of the Indexer API (`GET /stakers/{staker}`). */
export const INDEXER_API_URL = "https://api.chainza.io/safenet";

const REFETCH_INTERVAL_MS = 20_000;

/** Fields shared by every indexed staking event. On-chain numerics
 *  (`amount`, block fields) arrive as decimal strings — the Indexer API keeps
 *  uint256/BIGINT values out of JSON numbers. */
interface StakerEventBase {
  id: string;
  staker: Address;
  /** Base-unit SAFE amount, as a decimal string. */
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: Hash;
}

/** A `StakeIncreased` event — SAFE staked with a validator. */
export interface StakeIncreasedEvent extends StakerEventBase {
  validator: Address;
}

/** A `WithdrawalInitiated` event — stake moved into the withdrawal queue. */
export interface WithdrawalInitiatedEvent extends StakerEventBase {
  validator: Address;
  withdrawalId: string;
}

/** A `WithdrawalClaimed` event — a queued withdrawal paid out (the contract
 *  emits no validator on claims). */
export interface WithdrawalClaimedEvent extends StakerEventBase {
  withdrawalId: string;
}

/** Response of `GET /stakers/{staker}`: the staker's transaction history,
 *  one list per event type, each newest-first and paged independently by the
 *  same `limit`/`offset`. */
export interface StakerTransactions {
  staker: Address;
  limit: number;
  offset: number;
  stakeIncreaseds: StakeIncreasedEvent[];
  withdrawalInitiateds: WithdrawalInitiatedEvent[];
  withdrawalClaimeds: WithdrawalClaimedEvent[];
}

/** Key for the `useStakerTransactions` query. The staker segment is
 *  lowercased (the Indexer API's canonical form) so checksummed and lowercase
 *  callers share one cache entry; `undefined` only occurs while disabled. */
export const stakerTransactionsQueryKey = (
  staker: Address | undefined,
  limit: number | undefined,
  offset: number | undefined,
) => ["safe-stake", "staker-transactions", staker?.toLowerCase(), limit, offset] as const;

export interface UseStakerTransactionsOptions {
  /** Events per list; the Indexer API defaults to 50 and caps at 200. */
  limit?: number;
  /** Events to skip per list; the Indexer API defaults to 0. */
  offset?: number;
}

/**
 * The connected account's staking transaction history from the Indexer API's
 * `GET /stakers/{staker}` endpoint: stake increases,
 * withdrawal initiations and withdrawal claims, each carrying its
 * `transactionHash`/`blockNumber`/`blockTimestamp`. Disabled (data stays
 * `undefined`) while no account is connected; keyed by account and paging so
 * switching either refetches rather than serving stale history, and re-read
 * on a 20s interval to pick up newly indexed events.
 */
export function useStakerTransactions({ limit, offset }: UseStakerTransactionsOptions = {}) {
  const { address } = useConnection();

  return useQuery({
    queryKey: stakerTransactionsQueryKey(address, limit, offset),
    enabled: address !== undefined,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<StakerTransactions> => {
      assert(address !== undefined, "staker-transactions queryFn ran without an account");
      // axios drops undefined params and throws on non-2xx responses.
      const response = await axios.get<StakerTransactions>(
        `${INDEXER_API_URL}/stakers/${address.toLowerCase()}`,
        { params: { limit, offset } },
      );
      return response.data;
    },
  });
}
