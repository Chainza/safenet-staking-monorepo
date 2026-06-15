import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, usePublicClient } from "wagmi";
import type { Hash } from "viem";
import { logger } from "../lib/logger.js";
import { useSafeStakeClient } from "./useSafeStakeClient.js";
import { withdrawalsQueryKey } from "./useWithdrawals.js";
import { safeBalanceQueryKey } from "./useSafeBalance.js";

/**
 * The claim write flow as one mutation: `claimWithdrawal()` releases the next
 * matured withdrawal (the queue head) back to the wallet. SAFE's contract method
 * takes no arguments — it always settles the oldest claimable entry — so the
 * mutation needs no variables; the panel only enables it once a row has matured.
 *
 * On success it invalidates the two reads the tx moves: the withdrawal queue
 * (the claimed entry leaves it) and the wallet balance (the tokens return).
 * Mutations never auto-retry (a write may have broadcast despite an error).
 */
export function useClaim() {
  const { address } = useConnection();
  const client = useSafeStakeClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Hash> => {
      if (client === undefined || address === undefined || publicClient === undefined) {
        throw new Error("claim requires a connected wallet on a supported chain");
      }

      const hash = await client.staking.claimWithdrawal();
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onError: (err) => logger.error("claim failed:", err),
    onSuccess: () => {
      const chainId = client?.config.chainId;
      queryClient.invalidateQueries({ queryKey: withdrawalsQueryKey(chainId, address) });
      queryClient.invalidateQueries({ queryKey: safeBalanceQueryKey(chainId, address) });
    },
  });
}
