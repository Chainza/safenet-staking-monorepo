import type { SafeStakeClient } from "safe-stake-core";
import { useSanctionsCleared } from "./useIsSanctioned.js";
import { useSafeStakeClientUnscreened } from "./useSafeStakeClientUnscreened.js";

/**
 * The single seam to core: the full pre-bound `safe-stake-core` client for the
 * active wagmi chain (see `useSafeStakeClientUnscreened` for the binding
 * rules), **gated on sanctions screening — fail-closed**. Until the screen
 * clears the connected wallet (`useSanctionsCleared`: a confirmed
 * not-sanctioned from the Chainalysis oracle) this returns `undefined` —
 * exactly like an unsupported chain — so every dependent query disables
 * itself and every mutation throws. A pending, failed or flagged screen all
 * block: no RPC or API call runs before the wallet is known clean. While
 * disconnected there is no account to screen, so the client passes through
 * (account-scoped hooks disable themselves on the missing address).
 */
export function useSafeStakeClient(): SafeStakeClient | undefined {
  const client = useSafeStakeClientUnscreened();
  const cleared = useSanctionsCleared();
  return cleared ? client : undefined;
}
