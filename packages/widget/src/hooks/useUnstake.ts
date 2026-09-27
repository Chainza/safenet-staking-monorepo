import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { assert } from "ts-essentials";
import { logger } from "../lib/logger.js";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import { useTxSender, type TxOutcome } from "./useTxSender.js";
import { withdrawalsQueryKey } from "./useWithdrawals.js";

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
 * panels refresh; a Safe proposal moves nothing yet (see `useTxSender`).
 * Mutations never auto-retry (a write may have broadcast despite an error).
 */
export function useUnstake() {
  const { address } = useConnection();
  const client = useSafeStakeClient();
  const sender = useTxSender();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ validator, amount }: UnstakeVars): Promise<TxOutcome> => {
      assert(
        client !== undefined && address !== undefined,
        "unstake requires a connected wallet on a supported chain",
      );

      if (await sender.isSafeAccount()) {
        return sender.batchForSafe([
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
      if (outcome.status !== "confirmed") return;
      const chainId = client?.config.chainId;
      queryClient.invalidateQueries({ queryKey: withdrawalsQueryKey(chainId, address) });
      // Prefix-match every staked-balance / validator-stakes entry for this
      // chain (any validator) — both totals move when the withdrawal is queued.
      queryClient.invalidateQueries({ queryKey: ["safe-stake", "staked-balance", chainId] });
      queryClient.invalidateQueries({ queryKey: ["safe-stake", "validator-stakes", chainId] });
    },
  });
}
