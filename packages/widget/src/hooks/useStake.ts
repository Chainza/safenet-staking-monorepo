import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { assert } from "ts-essentials";
import { logger } from "../lib/logger.js";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import { useTxSender, type EncodedCall, type TxOutcome } from "./useTxSender.js";
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
 * approval. Under a Safe the (optional) approve and the stake go out as one
 * batched proposal instead (see `useTxSender`) — sequencing them would block
 * the stake on an approval the Safe's owners may not execute for days.
 *
 * Once confirmed it invalidates every read the two txs move (wallet balance,
 * allowance, the account's staked balances and the validator stake totals) so
 * the panels refresh; a Safe proposal moves nothing yet. `step` reports which
 * tx is in flight; mutations never auto-retry (a write may have broadcast
 * despite an error).
 */
export function useStake() {
  const { address } = useConnection();
  const client = useSafeStakeClient();
  const sender = useTxSender();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<StakeStep>("idle");

  const mutation = useMutation({
    mutationFn: async ({ validator, amount }: StakeVars): Promise<TxOutcome> => {
      assert(
        client !== undefined && address !== undefined,
        "stake requires a connected wallet on a supported chain",
      );

      const [allowance, isSafe] = await Promise.all([
        client.token.getAllowance(address),
        sender.isSafeAccount(),
      ]);

      if (isSafe) {
        setStep("staking");
        const { staking, token } = client.config.addresses;
        const calls: EncodedCall[] = [];
        if (allowance < amount) {
          calls.push({ to: token, data: client.token.encodeApprove(staking, amount) });
        }
        calls.push({ to: staking, data: client.staking.encodeStake(validator, amount) });
        return sender.batchForSafe(calls);
      }

      if (allowance < amount) {
        setStep("approving");
        await sender.confirmOnChain(await client.token.approve(amount));
      }

      setStep("staking");
      return sender.confirmOnChain(await client.staking.stake(validator, amount));
    },
    onError: (err) => logger.error("stake failed:", err),
    onSettled: () => setStep("idle"),
    onSuccess: (outcome) => {
      if (outcome.status !== "confirmed") return;
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
