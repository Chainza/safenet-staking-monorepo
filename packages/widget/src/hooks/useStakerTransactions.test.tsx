import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import axios from "axios";
import { useStakerTransactions, INDEXER_API_URL } from "./useStakerTransactions.js";
import type { StakerTransactions } from "./useStakerTransactions.js";
import { WagmiHarness, mainnetConfig, TEST_ADDRESS } from "../test/wagmi.js";

// The hook is a plain HTTP query against the Indexer API — mock axios and
// assert the URL/params construction, enabled gating and payload passthrough.
vi.mock("axios", () => ({ default: { get: vi.fn() } }));
const getMock = vi.mocked(axios.get);

const STAKER = TEST_ADDRESS.toLowerCase() as StakerTransactions["staker"];

/** Indexer response as served: three lists, numerics as strings. */
const HISTORY: StakerTransactions = {
  staker: STAKER,
  limit: 50,
  offset: 0,
  stakeIncreaseds: [
    {
      id: "0xaaa-1",
      staker: STAKER,
      validator: "0x3d58a5475c1336b0a755c3abd298ceb9b7bb9cde",
      amount: "1000000000000000000",
      blockNumber: "23000001",
      blockTimestamp: "1750000000",
      transactionHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
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
      transactionHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
    },
  ],
  withdrawalClaimeds: [],
};

const wrapper =
  (connected: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WagmiHarness config={mainnetConfig(connected)}>{children}</WagmiHarness>
  );

describe("useStakerTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockResolvedValue({ data: HISTORY });
  });

  it("stays disabled (no request, no data) while disconnected", () => {
    const { result } = renderHook(() => useStakerTransactions(), { wrapper: wrapper(false) });
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("fetches the connected account's history, lowercased", async () => {
    const { result } = renderHook(() => useStakerTransactions(), { wrapper: wrapper(true) });

    await waitFor(() => expect(result.current.data).toEqual(HISTORY));
    // The mock account is checksummed; the Indexer API only accepts lowercase.
    // Undefined limit/offset are dropped by axios, not sent as literals.
    expect(getMock).toHaveBeenCalledWith(`${INDEXER_API_URL}/stakers/${STAKER}`, {
      params: { limit: undefined, offset: undefined },
    });
  });

  it("passes limit and offset through as query params (and into the key)", async () => {
    const { result } = renderHook(() => useStakerTransactions({ limit: 10, offset: 20 }), {
      wrapper: wrapper(true),
    });

    await waitFor(() => expect(result.current.data).toEqual(HISTORY));
    expect(getMock).toHaveBeenCalledWith(`${INDEXER_API_URL}/stakers/${STAKER}`, {
      params: { limit: 10, offset: 20 },
    });
  });

  it("surfaces an HTTP failure as a query error", async () => {
    getMock.mockRejectedValue(new Error("Request failed with status code 500"));
    const { result } = renderHook(() => useStakerTransactions(), { wrapper: wrapper(true) });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Request failed with status code 500");
    expect(result.current.data).toBeUndefined();
  });
});
