import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  HttpRequestError,
  parseAbi,
} from "viem";
import { useWidgetStore } from "../store.js";
import { useTxSender } from "./useTxSender.js";

const SAFE = "0xA21E80bd9dc6a2f501D5b3DF527eA0884Ef11De4" as const;
const STAKING = "0x115E78f160e1E3eF163B05C84562Fa16fA338509" as const;
const SAFE_TX_HASH = `0x${"5a".repeat(32)}`;
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
      chain: { id: number };
      sendCalls: ReturnType<typeof vi.fn>;
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

describe("useTxSender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWidgetStore.setState({ safeProposals: [] });
    connectorType = "injected";
    walletClient = {
      account: { address: SAFE },
      chain: { id: 1 },
      sendCalls: vi.fn().mockResolvedValue({ id: SAFE_TX_HASH }),
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
    it("sends every call as one wallet_sendCalls batch and ends `proposed` at once", async () => {
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe("stake", CALLS)).resolves.toEqual({
        status: "proposed",
        safeTxHash: SAFE_TX_HASH,
      });
      expect(walletClient?.sendCalls).toHaveBeenCalledWith({ calls: CALLS });
      // Settlement is the watchers' job — nothing is awaited here.
      expect(publicClient?.waitForTransactionReceipt).not.toHaveBeenCalled();
    });

    it("registers the proposal for its flow, account and chain", async () => {
      const { result } = renderHook(() => useTxSender());

      await result.current.batchForSafe("claim", CALLS);
      expect(useWidgetStore.getState().safeProposals).toEqual([
        { id: SAFE_TX_HASH, flow: "claim", account: SAFE, chainId: 1, status: "pending" },
      ]);
    });

    it("registers nothing when wallet_sendCalls is rejected", async () => {
      walletClient?.sendCalls.mockRejectedValue(new Error("user rejected"));
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe("stake", CALLS)).rejects.toThrow("user rejected");
      expect(useWidgetStore.getState().safeProposals).toEqual([]);
    });

    it("refuses to send without a wallet client", async () => {
      walletClient = undefined;
      const { result } = renderHook(() => useTxSender());

      await expect(result.current.batchForSafe("stake", CALLS)).rejects.toThrow(
        "proposing a Safe transaction requires a wallet client",
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
