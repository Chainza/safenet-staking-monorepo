import { parseAbi } from "viem";

/**
 * ERC-20 ABI for the SAFE token.
 *
 * Re-exported from viem's built-in `erc20Abi` (the standard ERC-20 surface used
 * by the staking flows) so the package has a single source of truth: everything
 * imports `erc20Abi` from this module. See https://docs.safefoundation.org/ and
 * the official contracts at https://github.com/safe-research/safenet.
 */
export { erc20Abi } from "viem";

/**
 * ERC-2612 permit extension ABI. The SAFE token is an `ERC20Permit` token
 * (OpenZeppelin), so it supports gasless approvals via a signed `permit`. viem's
 * `erc20Abi` does not include these entries, so they live here as a small,
 * focused ABI used by the permit utilities in `token.ts`.
 */
export const erc20PermitAbi = parseAbi([
  "function nonces(address owner) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
]);
