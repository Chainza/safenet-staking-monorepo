import { useConnection, usePublicClient, useWalletClient } from "wagmi";
import { parseAbi, WaitForCallsStatusTimeoutError, type Address, type Hash, type Hex } from "viem";
import { assert } from "ts-essentials";
import { ONE } from "../lib/bigint.js";
import { logger } from "../lib/logger.js";
import { waitForSuccessfulReceipt } from "../lib/receipt.js";

/**
 * How a write flow ended. `confirmed`: the tx mined and succeeded on-chain.
 * `proposed`: the calls were queued as a Safe transaction that hasn't executed
 * yet — nothing on-chain has moved; it runs once the Safe's owners confirm and
 * execute it in Safe{Wallet}, which the widget does not track any further.
 */
export type TxOutcome =
  | { status: "confirmed"; hash: Hash }
  | { status: "proposed"; safeTxHash: string };

/** One contract call of a Safe batch — calldata from core's `encode*` builders. */
export interface EncodedCall {
  to: Address;
  data: Hex;
}

/** How long a 1-of-1 Safe gets to execute its batch before the flow settles
 *  for `proposed` — the same budget viem gives a receipt on the EOA path. */
export const SAFE_EXECUTION_TIMEOUT_MS = 180_000;

const safeAbi = parseAbi(["function getThreshold() view returns (uint256)"]);

/**
 * The one place write flows learn how the connected wallet settles a tx.
 *
 * Under wagmi's Safe connector (the widget running as a Safe App) a "tx hash"
 * is really a `safeTxHash` — the hash of a Safe transaction, which no RPC knows
 * — so waiting for its receipt can only time out. `isSafe` therefore routes a
 * flow to `batchForSafe`: its calls go out as a single EIP-5792
 * `wallet_sendCalls` (Safe batches them into one MultiSend), then:
 *
 * - a **multisig** (threshold > 1) ends `proposed` at once — the signer alone
 *   can't execute it, so there's nothing to wait for;
 * - a **1-of-1** Safe normally executes right away, so the flow waits (bounded)
 *   on `wallet_getCallsStatus`: success hands the real tx hash to
 *   `confirmOnChain`, a failed/cancelled Safe tx throws, and a timeout (signed
 *   but not executed) ends `proposed`.
 *
 * Once `wallet_sendCalls` has returned the calls are queued, so a failing
 * threshold or status lookup degrades to `proposed` — it never reports a
 * queued tx as failed. Every other wallet sends through core's writes and
 * `confirmOnChain` waits for a successful receipt.
 */
export function useTxSender() {
  const { connector } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const confirmOnChain = async (hash: Hash): Promise<TxOutcome> => {
    assert(publicClient !== undefined, "waiting for a receipt requires a public client");
    await waitForSuccessfulReceipt(publicClient, hash);
    return { status: "confirmed", hash };
  };

  const batchForSafe = async (calls: readonly EncodedCall[]): Promise<TxOutcome> => {
    assert(
      walletClient !== undefined && publicClient !== undefined,
      "proposing a Safe transaction requires a wallet and public client",
    );
    const { id } = await walletClient.sendCalls({ calls: [...calls] });
    const proposed: TxOutcome = { status: "proposed", safeTxHash: id };

    let settled;
    try {
      const threshold = await publicClient.readContract({
        address: walletClient.account.address,
        abi: safeAbi,
        functionName: "getThreshold",
      });
      if (threshold > ONE) return proposed;
      settled = await walletClient.waitForCallsStatus({ id, timeout: SAFE_EXECUTION_TIMEOUT_MS });
    } catch (err) {
      if (err instanceof WaitForCallsStatusTimeoutError) {
        logger.info(`Safe transaction ${id} not executed yet; leaving it queued`);
      } else {
        logger.warn(`couldn't settle Safe transaction ${id}; treating it as queued:`, err);
      }
      return proposed;
    }

    if (settled.status !== "success") {
      throw new Error(`Safe transaction failed (${id})`);
    }
    // Safe reports the one execution tx once per call — any receipt carries it.
    const hash = settled.receipts?.[0]?.transactionHash;
    if (hash === undefined) {
      logger.warn(`Safe transaction ${id} succeeded without a receipt; treating it as queued`);
      return proposed;
    }
    return confirmOnChain(hash);
  };

  return { isSafe: connector?.type === "safe", batchForSafe, confirmOnChain };
}
