import { useConnection, usePublicClient, useWalletClient } from "wagmi";
import {
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  parseAbi,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { assert } from "ts-essentials";
import { ZERO } from "../lib/bigint.js";
import { logger } from "../lib/logger.js";
import { waitForSuccessfulReceipt } from "../lib/receipt.js";
import { useWidgetStore, type WriteFlow } from "../store.js";

/**
 * How a write flow ended. `confirmed`: the tx mined and succeeded on-chain.
 * `proposed`: the calls were queued as a Safe transaction — nothing on-chain
 * has moved yet; it runs once the Safe's owners confirm and execute it in
 * Safe{Wallet}, and the `SafeProposalWatchers` refresh the reads when it does.
 */
export type TxOutcome =
  | { status: "confirmed"; hash: Hash }
  | { status: "proposed"; safeTxHash: string };

/** One contract call of a Safe batch — calldata from core's `encode*` builders. */
export interface EncodedCall {
  to: Address;
  data: Hex;
}

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
 * `batchForSafe`, which proposes the calls and ends `proposed`; the Safe's
 * execution is awaited by `SafeProposalWatchers`. Every other wallet sends
 * through core's writes and `confirmOnChain` waits for a successful receipt.
 */
export function useTxSender() {
  const { address, connector } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const addSafeProposal = useWidgetStore((s) => s.addSafeProposal);

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

  /**
   * Send a Safe account's calls as one EIP-5792 `wallet_sendCalls` batch (Safe
   * wraps them in a single MultiSend), register the returned id as a pending
   * proposal of `flow`, and end `proposed` straight away. Settlement is the
   * `SafeProposalWatchers`' job: they wait for the Safe to execute it — seconds
   * for a 1-of-1, days for a multisig — and then refresh the flow's reads.
   */
  const batchForSafe = async (
    flow: WriteFlow,
    calls: readonly EncodedCall[],
  ): Promise<TxOutcome> => {
    assert(walletClient !== undefined, "proposing a Safe transaction requires a wallet client");
    const { id } = await walletClient.sendCalls({ calls: [...calls] });
    addSafeProposal({
      id,
      flow,
      account: walletClient.account.address,
      chainId: walletClient.chain.id,
    });
    logger.info(`${flow}: proposed Safe transaction ${id}; waiting for it to execute`);
    return { status: "proposed", safeTxHash: id };
  };

  return { isSafeAccount, batchForSafe, confirmOnChain };
}
