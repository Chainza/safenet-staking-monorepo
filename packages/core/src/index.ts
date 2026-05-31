import type { Address } from "viem";

export const VERSION = "0.0.0";

/** Configuration for connecting to the SAFE staking contracts. */
export interface StakingConfig {
  /** Chain ID the staking contract is deployed on. */
  chainId: number;
  /** Address of the SAFE staking contract. */
  stakingContract: Address;
}
