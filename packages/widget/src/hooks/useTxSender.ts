import { useConnection, usePublicClient, useWalletClient } from "wagmi";
import type { Address, Hash, Hex } from "viem";
import { assert } from "ts-essentials";
import { waitForSuccessfulReceipt } from "../lib/receipt.js";

/**
 * How a write flow ended. `confirmed`: the tx mined and succeeded on-chain.
 * `proposed`: the calls were queued as a Safe transaction — nothing on-chain has
 * moved yet; it runs only once the Safe's owners confirm and execute it in
 * Safe{Wallet}, which the widget does not track.
 */
export type TxOutcome =
  | { status: "confirmed"; hash: Hash }
  | { status: "proposed"; safeTxHash: string };

/** One contract call of a Safe batch — calldata from core's `encode*` builders. */
export interface EncodedCall {
  to: Address;
  data: Hex;
}

/**
 * The one place write flows learn how the connected wallet settles a tx.
 *
 * Under wagmi's Safe connector (the widget running as a Safe App) a "tx hash"
 * is really a `safeTxHash` — the hash of a queued Safe transaction, which no
 * RPC knows — so waiting for its receipt can only time out, and a multisig may
 * take days to execute anyway. `isSafe` therefore routes a flow to
 * `batchForSafe`: its calls go out as a single EIP-5792 `wallet_sendCalls`
 * (Safe batches them into one MultiSend) and the flow ends `proposed`. Every
 * other wallet sends through core's writes and `confirmOnChain` waits for a
 * successful receipt.
 */
export function useTxSender() {
  const { connector } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  return {
    isSafe: connector?.type === "safe",

    batchForSafe: async (calls: readonly EncodedCall[]): Promise<TxOutcome> => {
      assert(walletClient !== undefined, "proposing a Safe transaction requires a wallet client");
      const { id } = await walletClient.sendCalls({ calls: [...calls] });
      return { status: "proposed", safeTxHash: id };
    },

    confirmOnChain: async (hash: Hash): Promise<TxOutcome> => {
      assert(publicClient !== undefined, "waiting for a receipt requires a public client");
      await waitForSuccessfulReceipt(publicClient, hash);
      return { status: "confirmed", hash };
    },
  };
}
