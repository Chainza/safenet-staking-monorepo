import { useChainId, usePublicClient, useWalletClient } from "wagmi";
import { createSafeStakeClient, KNOWN_DEPLOYMENTS, type SafeStakeClient } from "safe-stake-core";

/**
 * The pre-compliance `safe-stake-core` client for the **active wagmi chain** —
 * every read/write/encode the package exposes, bound to the current
 * `PublicClient` (and `WalletClient` once connected, enabling writes).
 *
 * The chain id comes from wagmi (`useChainId`), not from props, so a chain
 * switch rebinds the client to the new chain's deployment — data hooks keyed
 * on `client.config.chainId` refetch instead of showing the previous chain's
 * values. Returns `undefined` on chains with no known SAFE deployment (or
 * before the public client exists); data hooks must disable themselves then.
 *
 * Compliance: this client is **not** sanctions-screened. It exists solely so
 * `useIsSanctioned` can read the oracle without gating on itself — everything
 * else must consume `useSafeStakeClient` (the screened seam) instead.
 */
export function useSafeStakeClientUnscreened(): SafeStakeClient | undefined {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const deployment = KNOWN_DEPLOYMENTS[chainId];
  if (
    publicClient === undefined ||
    !deployment?.staking ||
    !deployment.token ||
    !deployment.merkleDrop ||
    !deployment.sanctionsList
  ) {
    return undefined;
  }

  return createSafeStakeClient({ publicClient, walletClient, config: { chainId } });
}
