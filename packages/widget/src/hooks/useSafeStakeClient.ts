import { useChainId, usePublicClient, useWalletClient } from "wagmi";
import { createSafeStakeClient, KNOWN_DEPLOYMENTS, type SafeStakeClient } from "safe-stake-core";

/**
 * The full pre-bound `safe-stake-core` client for the **active wagmi chain** —
 * every read/write/encode the package exposes, bound to the current
 * `PublicClient` (and `WalletClient` once connected, enabling writes).
 *
 * The chain id comes from wagmi (`useChainId`), not from props, so a chain
 * switch rebinds the client to the new chain's deployment — data hooks keyed
 * on `client.config.chainId` refetch instead of showing the previous chain's
 * values. Returns `undefined` on chains with no known SAFE deployment (or
 * before the public client exists); data hooks must disable themselves then.
 */
export function useSafeStakeClient(): SafeStakeClient | undefined {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const deployment = KNOWN_DEPLOYMENTS[chainId];
  if (publicClient === undefined || !deployment?.staking || !deployment.token) return undefined;

  return createSafeStakeClient({ publicClient, walletClient, config: { chainId } });
}
