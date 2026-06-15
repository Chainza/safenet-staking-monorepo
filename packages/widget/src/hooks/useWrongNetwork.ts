import { useChainId, useConnection } from "wagmi";

/**
 * `true` when a wallet is connected but on a different chain than the app
 * targets — `useChainId` is the app's active config chain, `useConnection().chainId`
 * the wallet's. A tx would hit the wrong deployment, so the flow stays blocked
 * until they realign. `false` while disconnected (no chain to mismatch).
 */
export function useWrongNetwork(): boolean {
  const appChainId = useChainId();
  const { isConnected, chainId: walletChainId } = useConnection();
  return isConnected && walletChainId !== undefined && walletChainId !== appChainId;
}
