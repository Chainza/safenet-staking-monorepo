import { useQueryClient } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { assert } from "ts-essentials";
import { logger } from "../lib/logger.js";
import { useConnectionScopedMutation } from "./useConnectionScopedMutation.js";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import { useTxSender, type TxOutcome } from "./useTxSender.js";
import { invalidateFlowReads } from "./invalidateFlowReads.js";

export interface UnstakeVars {
  validator: Address;
  /** Amount in base units (already scaled by token decimals). */
  amount: bigint;
}

/**
 * The unstake write flow as one mutation: `initiateWithdrawal(validator, amount)`
 * moves the stake into the withdrawal queue, where it sits until the unbonding
 * delay clears (then `claimWithdrawal` releases it). A single tx — unlike stake
 * there's no token approval involved.
 *
 * Once the tx is confirmed it invalidates every read it moves (the account's
 * staked balances, the validator stake totals, and the withdrawal queue) so the
 * panels refresh (`invalidateFlowReads`); a Safe proposal moves nothing until
 * it executes, when `SafeProposalWatchers` refresh them.
 * Mutations never auto-retry (a write may have broadcast despite an error).
 */
export function useUnstake() {
  const { address } = useConnection();
  const client = useSafeStakeClient();
  const sender = useTxSender();
  const queryClient = useQueryClient();

  return useConnectionScopedMutation({
    mutationFn: async ({ validator, amount }: UnstakeVars): Promise<TxOutcome> => {
      assert(
        client !== undefined && address !== undefined,
        "unstake requires a connected wallet on a supported chain",
      );

      if (await sender.isSafeAccount()) {
        return sender.batchForSafe("unstake", [
          {
            to: client.config.addresses.staking,
            data: client.staking.encodeInitiateWithdrawal(validator, amount),
          },
        ]);
      }
      return sender.confirmOnChain(await client.staking.initiateWithdrawal(validator, amount));
    },
    onError: (err) => logger.error("unstake failed:", err),
    onSuccess: (outcome) => {
      // A Safe proposal moved nothing yet — its watcher refreshes on execution.
      if (outcome.status !== "confirmed") return;
      invalidateFlowReads(queryClient, "unstake", client?.config.chainId, address);
    },
  });
}
