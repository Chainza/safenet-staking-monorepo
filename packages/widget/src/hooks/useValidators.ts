import { useQuery } from "@tanstack/react-query";
import { getAddress, type Address } from "viem";
import { useSafeStakeClient } from "./useSafeStakeClient.js";

/** A validator the user can stake against: registry metadata plus live
 *  on-chain stake totals. */
export interface Validator {
  address: Address;
  name: string;
  /** Total SAFE delegated to this validator (base units). */
  totalStaked: bigint;
}

/**
 * The official Safenet Beta validator registry (address + label per
 * validator), linked from docs.safefoundation.org (safenet/overview/beta).
 * On-chain there is no validator enumeration, so this JSON is the source of
 * the *set*; stake totals still come from the contract.
 */
const VALIDATOR_INFO_URL =
  "https://raw.githubusercontent.com/safe-fndn/safenet-beta-data/main/assets/validator-info.json";

/** Shape of one entry in `validator-info.json`. */
interface ValidatorInfo {
  address: string;
  label: string;
  is_active: boolean;
  commission: number;
  participation_rate_14d: number;
}

/** Key for the registry-JSON query (chain-independent — it's an HTTP fetch). */
export const validatorListQueryKey = () => ["safe-stake", "validator-list"] as const;

/** Key for the per-validator on-chain stake totals query. */
export const validatorStakesQueryKey = (
  chainId: number | undefined,
  validators: readonly Address[],
) => ["safe-stake", "validator-stakes", chainId, validators] as const;

/**
 * The stakeable validator set: the registry JSON (active validators only,
 * checksummed; the set changes rarely, hence the hour-long staleTime)
 * combined with each validator's live on-chain total stake
 * (`staking.getTotalValidatorStakes`, one batched query for the whole set).
 * `totalStaked` is `0n` until the stake read resolves — and stays `0n` on
 * chains with no deployment, where it can't. Returns `[]` while the registry
 * loads (or fails); no account needed for any of it.
 */
export function useValidators(): Validator[] {
  const client = useSafeStakeClient();

  const { data: registry = [] } = useQuery({
    queryKey: validatorListQueryKey(),
    staleTime: 3_600_000,
    queryFn: async (): Promise<{ address: Address; name: string }[]> => {
      const response = await fetch(VALIDATOR_INFO_URL);
      if (!response.ok) {
        throw new Error(`validator registry fetch failed: HTTP ${response.status}`);
      }
      const infos: ValidatorInfo[] = await response.json();
      return infos
        .filter((info) => info.is_active)
        .map((info) => ({ address: getAddress(info.address), name: info.label }));
    },
  });

  const addresses = registry.map((validator) => validator.address);

  const { data: stakes } = useQuery({
    queryKey: validatorStakesQueryKey(client?.config.chainId, addresses),
    enabled: client !== undefined && addresses.length > 0,
    queryFn: () => {
      if (client === undefined) {
        throw new Error("validator-stakes queryFn ran without a client");
      }
      return Promise.all(
        addresses.map((address) => client.staking.getTotalValidatorStakes(address)),
      );
    },
  });

  return registry.map((validator, i) => ({ ...validator, totalStaked: stakes?.[i] ?? 0n }));
}
