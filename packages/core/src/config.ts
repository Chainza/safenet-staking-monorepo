import { getAddress, type Address } from "viem";

/**
 * Addresses of the on-chain contracts the core library interacts with, for a
 * single chain. Both `staking` and `token` are required.
 */
export interface ContractAddresses {
  staking: Address;
  token: Address;
}

/** Fully-resolved configuration consumed by the utility functions. */
export interface SafeStakeConfig {
  chainId: number;
  addresses: ContractAddresses;
}

/**
 * Consumer-facing configuration. Everything is optional: omit it entirely to
 * target mainnet with the built-in addresses, pass `chainId` to switch to
 * another known deployment, or pass `addresses` to override individual contract
 * addresses (e.g. point at a custom/local chain).
 */
export interface SafeStakeConfigInput {
  chainId?: number;
  addresses?: Partial<ContractAddresses>;
}

/** Default chain when none is supplied — Ethereum mainnet (the only live deployment). */
export const DEFAULT_CHAIN_ID = 1;

/**
 * Built-in contract addresses per chain id, per the official Safe Foundation
 * deployments (https://docs.safefoundation.org/,
 * https://github.com/safe-research/safenet).
 */
export const KNOWN_DEPLOYMENTS: Record<number, Partial<ContractAddresses>> = {
  // Ethereum mainnet
  1: {
    staking: "0x115E78f160e1E3eF163B05C84562Fa16fA338509",
    token: "0x5aFE3855358E112B5647B952709E6165e1c1eEEe",
  },
};

/**
 * Resolve a consumer-facing config into a fully-populated {@link SafeStakeConfig}.
 *
 * Chain id and contract addresses are dynamic: built-in defaults for the chain
 * are merged with any `addresses` overrides (overrides win), then every address
 * is normalised/validated via viem's `getAddress`. Throws if the required
 * `staking` or `token` address cannot be determined (e.g. an unknown chain with
 * no overrides supplied).
 */
export function resolveConfig(input: SafeStakeConfigInput = {}): SafeStakeConfig {
  const chainId = input.chainId ?? DEFAULT_CHAIN_ID;
  const base = KNOWN_DEPLOYMENTS[chainId] ?? {};
  const merged: Partial<ContractAddresses> = { ...base, ...input.addresses };

  if (!merged.staking) {
    throw new Error(
      `No staking address for chain ${chainId}. Pass addresses.staking to override.`,
    );
  }
  if (!merged.token) {
    throw new Error(
      `No token address for chain ${chainId}. Pass addresses.token to override.`,
    );
  }

  const addresses: ContractAddresses = {
    staking: getAddress(merged.staking),
    token: getAddress(merged.token),
  };

  return { chainId, addresses };
}

/** Type guard: has the config input already been resolved to a full config? */
export function isResolvedConfig(
  config: SafeStakeConfig | SafeStakeConfigInput,
): config is SafeStakeConfig {
  return (
    typeof (config as SafeStakeConfig).chainId === "number" &&
    !!(config as SafeStakeConfig).addresses?.staking &&
    !!(config as SafeStakeConfig).addresses?.token
  );
}
