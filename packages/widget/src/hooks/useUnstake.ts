import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, usePublicClient } from "wagmi";
import type { Address, Hash } from "viem";
import { logger } from "../lib/logger.js";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
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
 * On success it invalidates every read the tx moves (the account's staked
 * balances, the validator stake totals, and the withdrawal queue) so the panels
 * refresh. Mutations never auto-retry (a write may have broadcast despite an
 * error).
 */
export function useUnstake() {
  const { address } = useConnection();
  const client = useSafeStakeClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ validator, amount }: UnstakeVars): Promise<Hash> => {
      if (client === undefined || address === undefined || publicClient === undefined) {
        throw new Error("unstake requires a connected wallet on a supported chain");
      }

      const hash = await client.staking.initiateWithdrawal(validator, amount);
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onError: (err) => logger.error("unstake failed:", err),
    onSuccess: () => {
      const chainId = client?.config.chainId;
      queryClient.invalidateQueries({ queryKey: withdrawalsQueryKey(chainId, address) });
      // Prefix-match every staked-balance / validator-stakes entry for this
      // chain (any validator) — both totals move when the withdrawal is queued.
      queryClient.invalidateQueries({ queryKey: ["safe-stake", "staked-balance", chainId] });
      queryClient.invalidateQueries({ queryKey: ["safe-stake", "validator-stakes", chainId] });
    },
  });
}
