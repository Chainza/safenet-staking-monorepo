import { useConnection, usePublicClient, useWalletClient } from "wagmi";
import {
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  parseAbi,
  WaitForCallsStatusTimeoutError,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { assert } from "ts-essentials";
import { ONE, ZERO } from "../lib/bigint.js";
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

/** True when the error means "this contract has no working `getThreshold()`"
 *  (a revert or an empty return) — as opposed to the RPC call itself failing. */
function isMissingFunction(err: unknown): boolean {
  return (
    err instanceof BaseError &&
    err.walk(
      (e) =>
        e instanceof ContractFunctionRevertedError || e instanceof ContractFunctionZeroDataError,
    ) !== null
  );
}

/**
 * The one place write flows learn how the connected wallet settles a tx.
 *
 * When the connected account is a Safe — the widget running as a Safe App, or a
 * Safe connected from Safe{Wallet} over WalletConnect (the same Safe provider
 * answers both) — a "tx hash" is often a `safeTxHash`: the hash of a Safe
 * transaction, which no RPC knows, so waiting for its receipt can only time
 * out. `isSafeAccount()` (asked at submit time) therefore routes a flow to
 * `batchForSafe`: its calls go out as a single EIP-5792 `wallet_sendCalls`
 * (Safe batches them into one MultiSend), then:
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
  const { address, connector } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const confirmOnChain = async (hash: Hash): Promise<TxOutcome> => {
    assert(publicClient !== undefined, "waiting for a receipt requires a public client");
    await waitForSuccessfulReceipt(publicClient, hash);
    return { status: "confirmed", hash };
  };

  /**
   * Whether the connected account is a Safe. The Safe connector answers without
   * a read; for any other connector the account is a Safe when it has code and
   * a working `getThreshold()` (a non-zero one — every Safe needs ≥ 1 owner).
   * No code, or a contract without that function, is a regular wallet. An RPC
   * failure throws: nothing has been sent yet, and guessing "regular wallet"
   * would put a Safe on the receipt path that can only time out.
   */
  const isSafeAccount = async (): Promise<boolean> => {
    if (connector?.type === "safe") return true;
    assert(
      address !== undefined && publicClient !== undefined,
      "detecting a Safe account requires a connected wallet and a public client",
    );
    const code = await publicClient.getCode({ address });
    if (code === undefined || code === "0x") return false;
    try {
      const threshold = await publicClient.readContract({
        address,
        abi: safeAbi,
        functionName: "getThreshold",
      });
      return threshold > ZERO;
    } catch (err) {
      if (isMissingFunction(err)) return false;
      throw err;
    }
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

  return { isSafeAccount, batchForSafe, confirmOnChain };
}
