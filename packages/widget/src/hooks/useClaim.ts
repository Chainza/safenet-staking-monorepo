import { useQueryClient } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { assert } from "ts-essentials";
import { logger } from "../lib/logger.js";
import { useConnectionScopedMutation } from "./useConnectionScopedMutation.js";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import { useTxSender, type TxOutcome } from "./useTxSender.js";
import { withdrawalsQueryKey } from "./useWithdrawals.js";
import { safeBalanceQueryKey } from "./useSafeBalance.js";

/**
 * The claim write flow as one mutation: `claimWithdrawal()` releases the next
 * matured withdrawal (the queue head) back to the wallet. SAFE's contract method
 * takes no arguments — it always settles the oldest claimable entry — so the
 * mutation needs no variables; the panel only enables it once a row has matured.
 *
 * Once the tx is confirmed it invalidates the two reads it moves: the
 * withdrawal queue (the claimed entry leaves it) and the wallet balance (the
 * tokens return); a Safe proposal moves nothing yet (see `useTxSender`).
 * Mutations never auto-retry (a write may have broadcast despite an error).
 */
export function useClaim() {
  const { address } = useConnection();
  const client = useSafeStakeClient();
  const sender = useTxSender();
  const queryClient = useQueryClient();

  return useConnectionScopedMutation({
    mutationFn: async (): Promise<TxOutcome> => {
      assert(
        client !== undefined && address !== undefined,
        "claim requires a connected wallet on a supported chain",
      );

      if (await sender.isSafeAccount()) {
        return sender.batchForSafe([
          { to: client.config.addresses.staking, data: client.staking.encodeClaimWithdrawal() },
        ]);
      }
      return sender.confirmOnChain(await client.staking.claimWithdrawal());
    },
    onError: (err) => logger.error("claim failed:", err),
    onSuccess: (outcome) => {
      if (outcome.status !== "confirmed") return;
      const chainId = client?.config.chainId;
      queryClient.invalidateQueries({ queryKey: withdrawalsQueryKey(chainId, address) });
      queryClient.invalidateQueries({ queryKey: safeBalanceQueryKey(chainId, address) });
    },
  });
}
