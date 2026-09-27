import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  HttpRequestError,
  parseAbi,
  WaitForCallsStatusTimeoutError,
} from "viem";
import { SAFE_EXECUTION_TIMEOUT_MS, useTxSender } from "./useTxSender.js";

const SAFE = "0xA21E80bd9dc6a2f501D5b3DF527eA0884Ef11De4" as const;
const STAKING = "0x115E78f160e1E3eF163B05C84562Fa16fA338509" as const;
const SAFE_TX_HASH = `0x${"5a".repeat(32)}`;
const EXEC_HASH = `0x${"e0".repeat(32)}`;
const CALLS = [
  { to: STAKING, data: "0x01" as const },
  { to: STAKING, data: "0x02" as const },
];

const SAFE_CODE = "0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e";
const safeAbi = parseAbi(["function getThreshold() view returns (uint256)"]);

// The three wagmi hooks the seam reads are stubbed; `connectorType` picks the
// connector (the Safe App connector, WalletConnect, an injected wallet…).
let connectorType: string | undefined;
let walletClient:
  | {
      account: { address: typeof SAFE };
      sendCalls: ReturnType<typeof vi.fn>;
      waitForCallsStatus: ReturnType<typeof vi.fn>;
    }
  | undefined;
let publicClient:
  | {
      getCode: ReturnType<typeof vi.fn>;
      readContract: ReturnType<typeof vi.fn>;
      waitForTransactionReceipt: ReturnType<typeof vi.fn>;
    }
  | undefined;

vi.mock("wagmi", () => ({
  useConnection: () => ({
    address: SAFE,
    connector: connectorType === undefined ? undefined : { type: connectorType },
  }),
  usePublicClient: () => publicClient,
  useWalletClient: () => ({ data: walletClient }),
}));

const logger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn() }));
vi.mock("../lib/logger.js", () => ({ logger }));

/** What `waitForCallsStatus` resolves once a Safe executed the batch. */
function executed(status: "success" | "failure" = "success") {
  // Safe repeats the single execution receipt once per call.
  const receipt = { transactionHash: EXEC_HASH, status: "success" };
  return { status, statusCode: status === "success" ? 200 : 500, receipts: [receipt, receipt] };
}

describe("useTxSender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectorType = "injected";
    walletClient = {
      account: { address: SAFE },
      sendCalls: vi.fn().mockResolvedValue({ id: SAFE_TX_HASH }),
      waitForCallsStatus: vi.fn().mockResolvedValue(executed()),
    };
    publicClient = {
      getCode: vi.fn().mockResolvedValue(SAFE_CODE),
      readContract: vi.fn().mockResolvedValue(1n),
      waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: "success" }),
    };
  });

  describe("isSafeAccount", () => {
    const isSafeAccount = () => renderHook(() => useTxSender()).result.current.isSafeAccount();

    it("trusts the Safe App connector without reading the chain", async () => {
      connectorType = "safe";

      await expect(isSafeAccount()).resolves.toBe(true);
      expect(publicClient?.getCode).not.toHaveBeenCalled();
      expect(publicClient?.readContract).not.toHaveBeenCalled();
    });

    it("detects a Safe connected over another connector (e.g. WalletConnect)", async () => {
      connectorType = "walletConnect";

      await expect(isSafeAccount()).resolves.toBe(true);
      expect(publicClient?.getCode).toHaveBeenCalledWith({ address: SAFE });
      expect(publicClient?.readContract).toHaveBeenCalledWith(
        expect.objectContaining({ address: SAFE, functionName: "getThreshold" }),
      );
    });

    it("treats an account without code (an EOA) as a regular wallet", async () => {
      for (const code of [undefined, "0x"]) {
        publicClient?.getCode.mockResolvedValue(code);
        await expect(isSafeAccount()).resolves.toBe(false);
      }
      expect(publicClient?.readContract).not.toHaveBeenCalled();
    });

    it("treats a contract whose getThreshold() reverts as a regular wallet", async () => {
      publicClient?.readContract.mockRejectedValue(
        new ContractFunctionExecutionError(
          new ContractFunctionRevertedError({ abi: safeAbi, functionName: "getThreshold" }),
          { abi: safeAbi, functionName: "getThreshold", contractAddress: SAFE },
        ),
      );
      await expect(isSafeAccount()).resolves.toBe(false);
    });

    it("treats a contract whose getThreshold() returns nothing as a regular wallet", async () => {
      publicClient?.readContract.mockRejectedValue(
        new ContractFunctionZeroDataError({ functionName: "getThreshold" }),
      );
      await expect(isSafeAccount()).resolves.toBe(false);
    });

    it("rejects a zero threshold (no Safe has zero owners)", async () => {
      publicClient?.readContract.mockResolvedValue(0n);
      await expect(isSafeAccount()).resolves.toBe(false);
    });

    it("throws on an RPC failure instead of guessing a route", async () => {
      publicClient?.readContract.mockRejectedValue(
        new HttpRequestError({ url: "https://rpc.example", status: 503 }),
      );
      await expect(isSafeAccount()).rejects.toThrow(HttpRequestError);

      publicClient?.getCode.mockRejectedValue(new Error("rpc down"));
      await expect(isSafeAccount()).rejects.toThrow("rpc down");
    });
  });

  describe("batchForSafe", () => {
    it("sends every call as one wallet_sendCalls batch", async () => {
      const { result } = renderHook(() => useTxSender());

      await result.current.batchForSafe(CALLS);
      expect(walletClient?.sendCalls).toHaveBeenCalledWith({ calls: CALLS });
    });

    it("ends `proposed` at once for a multisig, without waiting on the Safe", async () => {
      publicClient?.readContract.mockResolvedValue(2n);
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe(CALLS)).resolves.toEqual({
        status: "proposed",
        safeTxHash: SAFE_TX_HASH,
      });
      expect(publicClient?.readContract).toHaveBeenCalledWith(
        expect.objectContaining({ address: SAFE, functionName: "getThreshold" }),
      );
      expect(walletClient?.waitForCallsStatus).not.toHaveBeenCalled();
      expect(publicClient?.waitForTransactionReceipt).not.toHaveBeenCalled();
    });

    it("confirms a 1-of-1 Safe's execution through the real tx hash", async () => {
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe(CALLS)).resolves.toEqual({
        status: "confirmed",
        hash: EXEC_HASH,
      });
      expect(walletClient?.waitForCallsStatus).toHaveBeenCalledWith({
        id: SAFE_TX_HASH,
        timeout: SAFE_EXECUTION_TIMEOUT_MS,
      });
      // Our own RPC must see the block too, so refetched reads aren't stale.
      expect(publicClient?.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: EXEC_HASH });
    });

    it("throws when the Safe reports the batch failed or was cancelled", async () => {
      walletClient?.waitForCallsStatus.mockResolvedValue(executed("failure"));
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe(CALLS)).rejects.toThrow(
        `Safe transaction failed (${SAFE_TX_HASH})`,
      );
      expect(publicClient?.waitForTransactionReceipt).not.toHaveBeenCalled();
    });

    it("rejects when the execution tx mined but reverted", async () => {
      publicClient?.waitForTransactionReceipt.mockResolvedValue({ status: "reverted" });
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe(CALLS)).rejects.toThrow(
        `Transaction reverted on-chain (${EXEC_HASH})`,
      );
    });

    it("ends `proposed` when a 1-of-1 Safe doesn't execute within the budget", async () => {
      walletClient?.waitForCallsStatus.mockRejectedValue(
        new WaitForCallsStatusTimeoutError({ id: SAFE_TX_HASH }),
      );
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe(CALLS)).resolves.toEqual({
        status: "proposed",
        safeTxHash: SAFE_TX_HASH,
      });
      expect(logger.info).toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("degrades to `proposed` (never failed) when the status lookup breaks", async () => {
      walletClient?.waitForCallsStatus.mockRejectedValue(new Error("rpc down"));
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe(CALLS)).resolves.toMatchObject({
        status: "proposed",
      });
      expect(logger.warn).toHaveBeenCalled();
    });

    it("degrades to `proposed` (never failed) when the threshold read breaks", async () => {
      publicClient?.readContract.mockRejectedValue(new Error("rpc down"));
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe(CALLS)).resolves.toMatchObject({
        status: "proposed",
      });
      expect(walletClient?.waitForCallsStatus).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it("degrades to `proposed` when a success arrives without a receipt", async () => {
      walletClient?.waitForCallsStatus.mockResolvedValue({ status: "success", receipts: [] });
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe(CALLS)).resolves.toMatchObject({
        status: "proposed",
      });
      expect(publicClient?.waitForTransactionReceipt).not.toHaveBeenCalled();
    });

    it("propagates a rejected wallet_sendCalls (nothing was queued)", async () => {
      walletClient?.sendCalls.mockRejectedValue(new Error("user rejected"));
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe(CALLS)).rejects.toThrow("user rejected");
    });

    it("refuses to send without a wallet client", async () => {
      walletClient = undefined;
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe(CALLS)).rejects.toThrow(
        "proposing a Safe transaction requires a wallet and public client",
      );
    });
  });

  describe("confirmOnChain", () => {
    it("waits for a successful receipt and ends `confirmed`", async () => {
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.confirmOnChain("0xabc")).resolves.toEqual({
        status: "confirmed",
        hash: "0xabc",
      });
      expect(publicClient?.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: "0xabc" });
    });

    it("rejects a reverted receipt", async () => {
      publicClient?.waitForTransactionReceipt.mockResolvedValue({ status: "reverted" });
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.confirmOnChain("0xabc")).rejects.toThrow(
        "Transaction reverted on-chain (0xabc)",
      );
    });

    it("refuses to wait without a public client", async () => {
      publicClient = undefined;
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.confirmOnChain("0xabc")).rejects.toThrow(
        "waiting for a receipt requires a public client",
      );
    });
  });
});
