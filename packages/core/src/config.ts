import { getAddress, type Address } from "viem";

/**
 * Addresses of the on-chain contracts the core library interacts with, for a
 * single chain. All four are required: `staking`, `token`, `merkleDrop` (the
 * rewards distributor) and `sanctionsList` (the Chainalysis sanctions oracle
 * used for compliance screening).
 */
export interface ContractAddresses {
  staking: Address;
  token: Address;
  merkleDrop: Address;
  sanctionsList: Address;
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
 * https://github.com/safe-research/safenet). `sanctionsList` is not a SAFE
 * contract — it's the Chainalysis sanctions oracle
 * (https://go.chainalysis.com/chainalysis-oracle-docs.html).
 */
export const KNOWN_DEPLOYMENTS: Record<number, Partial<ContractAddresses>> = {
  // Ethereum mainnet
  1: {
    staking: "0x115E78f160e1E3eF163B05C84562Fa16fA338509",
    token: "0x5aFE3855358E112B5647B952709E6165e1c1eEEe",
    merkleDrop: "0xe5139Fc0FB8eae81e30d8a85C22E88c6757120f2",
    sanctionsList: "0x40C57923924B5c5c5455c48D93317139ADDaC8fb",
  },
};

/**
 * Resolve a consumer-facing config into a fully-populated {@link SafeStakeConfig}.
 *
 * Chain id and contract addresses are dynamic: built-in defaults for the chain
 * are merged with any `addresses` overrides (overrides win), then every address
 * is normalised/validated via viem's `getAddress`. Throws if any required
 * address cannot be determined (e.g. an unknown chain with no overrides
 * supplied).
 */
export function resolveConfig(input: SafeStakeConfigInput = {}): SafeStakeConfig {
  const chainId = input.chainId ?? DEFAULT_CHAIN_ID;
  const base = KNOWN_DEPLOYMENTS[chainId] ?? {};
  const merged: Partial<ContractAddresses> = { ...base, ...input.addresses };

  if (!merged.staking) {
    throw new Error(`No staking address for chain ${chainId}. Pass addresses.staking to override.`);
  }
  if (!merged.token) {
    throw new Error(`No token address for chain ${chainId}. Pass addresses.token to override.`);
  }
  if (!merged.merkleDrop) {
    throw new Error(
      `No merkleDrop address for chain ${chainId}. Pass addresses.merkleDrop to override.`,
    );
  }
  if (!merged.sanctionsList) {
    throw new Error(
      `No sanctionsList address for chain ${chainId}. Pass addresses.sanctionsList to override.`,
    );
  }

  const addresses: ContractAddresses = {
    staking: getAddress(merged.staking),
    token: getAddress(merged.token),
    merkleDrop: getAddress(merged.merkleDrop),
    sanctionsList: getAddress(merged.sanctionsList),
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
    !!(config as SafeStakeConfig).addresses?.token &&
    !!(config as SafeStakeConfig).addresses?.merkleDrop &&
    !!(config as SafeStakeConfig).addresses?.sanctionsList
  );
}
