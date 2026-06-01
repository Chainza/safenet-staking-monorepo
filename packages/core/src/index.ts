/** Package version. */
export const VERSION = "0.0.0";

// Config — dynamic chain id + overridable contract addresses.
export {
  DEFAULT_CHAIN_ID,
  KNOWN_DEPLOYMENTS,
  resolveConfig,
  isResolvedConfig,
  type ContractAddresses,
  type SafeStakeConfig,
  type SafeStakeConfigInput,
} from "./config.js";

// Shared types.
export type { ConnectedWalletClient, PendingWithdrawal, Address } from "./types.js";

// ABIs.
export { stakingAbi, erc20Abi, erc20PermitAbi } from "./abi/index.js";

// Per-method utilities (standalone, tree-shakable).
export * as staking from "./staking.js";
export * as token from "./token.js";

// Factory client (ergonomic, pre-bound) — the surface the widget mainly uses.
export { createSafeStakeClient, type CreateSafeStakeClientParams, type SafeStakeClient } from "./client.js";
