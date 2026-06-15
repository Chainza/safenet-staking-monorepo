import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, usePublicClient } from "wagmi";
import type { Address, Hash } from "viem";
import { logger } from "../lib/logger.js";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import { safeBalanceQueryKey } from "./useSafeBalance.js";
import { safeAllowanceQueryKey } from "./useSafeAllowance.js";

export interface StakeVars {
  validator: Address;
  /** Amount in base units (already scaled by token decimals). */
  amount: bigint;
}

/** Which on-chain tx the stake flow is currently awaiting (for button copy). */
export type StakeStep = "idle" | "approving" | "staking";

/**
 * The full stake write flow as one mutation: ensure the staking contract is
 * approved for `amount` — sending an `approve` and waiting for it to mine *only*
 * when the live allowance is short — then `stake(validator, amount)` and wait
 * for its receipt. SAFE's `stake` accepts no permit signature, so a separate
 * approval tx is unavoidable; the allowance is re-read at submit time (the
 * cached `useSafeAllowance` value may be stale) so we never send a redundant
 * approval.
 *
 * On success it invalidates every read the two txs move (wallet balance,
 * allowance, the account's staked balances and the validator stake totals) so
 * the panels refresh. `step` reports which tx is in flight; mutations never
 * auto-retry (a write may have broadcast despite an error).
 */
export function useStake() {
  const { address } = useConnection();
  const client = useSafeStakeClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<StakeStep>("idle");

  const mutation = useMutation({
    mutationFn: async ({ validator, amount }: StakeVars): Promise<Hash> => {
      if (client === undefined || address === undefined || publicClient === undefined) {
        throw new Error("stake requires a connected wallet on a supported chain");
      }

      const allowance = await client.token.getAllowance(address);
      if (allowance < amount) {
        setStep("approving");
        const approveHash = await client.token.approve(amount);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      setStep("staking");
      const hash = await client.staking.stake(validator, amount);
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onError: (err) => logger.error("stake failed:", err),
    onSettled: () => setStep("idle"),
    onSuccess: () => {
      const chainId = client?.config.chainId;
      queryClient.invalidateQueries({ queryKey: safeBalanceQueryKey(chainId, address) });
      queryClient.invalidateQueries({ queryKey: safeAllowanceQueryKey(chainId, address) });
      // Prefix-match every staked-balance / validator-stakes entry for this
      // chain (any validator) — both totals move when the stake lands.
      queryClient.invalidateQueries({ queryKey: ["safe-stake", "staked-balance", chainId] });
      queryClient.invalidateQueries({ queryKey: ["safe-stake", "validator-stakes", chainId] });
    },
  });

  return { ...mutation, step };
}
