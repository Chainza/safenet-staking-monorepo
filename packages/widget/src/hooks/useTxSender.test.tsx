import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTxSender } from "./useTxSender.js";

const STAKING = "0x115E78f160e1E3eF163B05C84562Fa16fA338509" as const;
const SAFE_TX_HASH = `0x${"5a".repeat(32)}`;

// The three wagmi hooks the seam reads are stubbed; `connectorType` flips the
// connected wallet between a Safe App and a regular EOA wallet.
let connectorType: string | undefined;
let walletClient: { sendCalls: ReturnType<typeof vi.fn> } | undefined;
let publicClient: { waitForTransactionReceipt: ReturnType<typeof vi.fn> } | undefined;

vi.mock("wagmi", () => ({
  useConnection: () => ({
    connector: connectorType === undefined ? undefined : { type: connectorType },
  }),
  usePublicClient: () => publicClient,
  useWalletClient: () => ({ data: walletClient }),
}));

describe("useTxSender", () => {
  beforeEach(() => {
    connectorType = "injected";
    walletClient = { sendCalls: vi.fn().mockResolvedValue({ id: SAFE_TX_HASH }) };
    publicClient = { waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: "success" }) };
  });

  it("flags the Safe connector and nothing else", () => {
    connectorType = "safe";
    expect(renderHook(() => useTxSender()).result.current.isSafe).toBe(true);

    connectorType = "injected";
    expect(renderHook(() => useTxSender()).result.current.isSafe).toBe(false);

    connectorType = undefined;
    expect(renderHook(() => useTxSender()).result.current.isSafe).toBe(false);
  });

  it("proposes every call as one wallet_sendCalls batch and ends `proposed`", async () => {
    const { result } = renderHook(() => useTxSender());
    const calls = [
      { to: STAKING, data: "0x01" as const },
      { to: STAKING, data: "0x02" as const },
    ];

    await expect(result.current.batchForSafe(calls)).resolves.toEqual({
      status: "proposed",
      safeTxHash: SAFE_TX_HASH,
    });
    expect(walletClient?.sendCalls).toHaveBeenCalledWith({ calls });
    expect(publicClient?.waitForTransactionReceipt).not.toHaveBeenCalled();
  });

  it("refuses to propose without a wallet client", async () => {
    walletClient = undefined;
    const { result } = renderHook(() => useTxSender());

    await expect(result.current.batchForSafe([])).rejects.toThrow(
      "proposing a Safe transaction requires a wallet client",
    );
  });

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
