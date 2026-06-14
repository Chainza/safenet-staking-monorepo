import { encodeFunctionData, type Address, type Hash, type Hex, type PublicClient } from "viem";
import { erc20Abi, erc20PermitAbi } from "./abi/erc20.js";
import type { SafeStakeConfig } from "./config.js";
import type { ConnectedWalletClient, TokenMeta } from "./types.js";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Token name (e.g. "Safe Token"). */
export function getTokenName(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.token,
    abi: erc20Abi,
    functionName: "name",
  });
}

/** Token symbol (e.g. "SAFE"). */
export function getTokenSymbol(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.token,
    abi: erc20Abi,
    functionName: "symbol",
  });
}

/** Token decimals. */
export function getTokenDecimals(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.token,
    abi: erc20Abi,
    functionName: "decimals",
  });
}

/**
 * Token name, symbol and decimals in a single multicall — one RPC round trip
 * instead of three. These are immutable, so consumers can cache the result
 * indefinitely. Requires a Multicall3 deployment on the chain (present on every
 * `KNOWN_DEPLOYMENTS` chain); `allowFailure: false` surfaces a missing token as
 * a thrown error rather than per-call failures.
 */
export async function getTokenMeta(
  client: PublicClient,
  config: SafeStakeConfig,
): Promise<TokenMeta> {
  const token = { address: config.addresses.token, abi: erc20Abi } as const;
  const [name, symbol, decimals] = await client.multicall({
    allowFailure: false,
    contracts: [
      { ...token, functionName: "name" },
      { ...token, functionName: "symbol" },
      { ...token, functionName: "decimals" },
    ],
  });
  return { name, symbol, decimals };
}

/** Total token supply. */
export function getTotalSupply(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.token,
    abi: erc20Abi,
    functionName: "totalSupply",
  });
}

/** SAFE balance of `owner`. */
export function getBalance(client: PublicClient, config: SafeStakeConfig, owner: Address) {
  return client.readContract({
    address: config.addresses.token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
  });
}

/**
 * SAFE allowance `owner` has granted `spender`. `spender` defaults to the
 * staking contract — the spender that needs approval before `stake`.
 */
export function getAllowance(
  client: PublicClient,
  config: SafeStakeConfig,
  owner: Address,
  spender: Address = config.addresses.staking,
) {
  return client.readContract({
    address: config.addresses.token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender],
  });
}

/** Current ERC-2612 permit nonce for `owner` (used when signing a permit). */
export function getNonce(client: PublicClient, config: SafeStakeConfig, owner: Address) {
  return client.readContract({
    address: config.addresses.token,
    abi: erc20PermitAbi,
    functionName: "nonces",
    args: [owner],
  });
}

/** EIP-712 domain separator of the token (used when signing a permit). */
export function getDomainSeparator(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.token,
    abi: erc20PermitAbi,
    functionName: "DOMAIN_SEPARATOR",
  });
}

// ---------------------------------------------------------------------------
// Writes (send)
// ---------------------------------------------------------------------------

/**
 * Approve `spender` to move `amount` of SAFE. `spender` defaults to the staking
 * contract (the approval `stake` requires).
 */
export function approve(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  amount: bigint,
  spender: Address = config.addresses.staking,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.token,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
    account: client.account,
    chain: client.chain,
  });
}

/** Transfer `amount` of SAFE to `to`. */
export function transfer(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  to: Address,
  amount: bigint,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.token,
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amount],
    account: client.account,
    chain: client.chain,
  });
}

/** Transfer `amount` of SAFE from `from` to `to` (requires prior allowance). */
export function transferFrom(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  from: Address,
  to: Address,
  amount: bigint,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.token,
    abi: erc20Abi,
    functionName: "transferFrom",
    args: [from, to, amount],
    account: client.account,
    chain: client.chain,
  });
}

/**
 * Submit a signed ERC-2612 permit, setting `owner`'s allowance to `spender`
 * without a prior `approve` tx. `(v, r, s)` come from the owner's EIP-712
 * signature over the permit struct.
 */
export function permit(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  owner: Address,
  spender: Address,
  value: bigint,
  deadline: bigint,
  v: number,
  r: Hex,
  s: Hex,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.token,
    abi: erc20PermitAbi,
    functionName: "permit",
    args: [owner, spender, value, deadline, v, r, s],
    account: client.account,
    chain: client.chain,
  });
}

// ---------------------------------------------------------------------------
// Writes (encode)
// ---------------------------------------------------------------------------

/** Encode calldata for `approve(spender, amount)`. */
export function encodeApprove(spender: Address, amount: bigint): Hex {
  return encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [spender, amount] });
}

/** Encode calldata for `transfer(to, amount)`. */
export function encodeTransfer(to: Address, amount: bigint): Hex {
  return encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [to, amount] });
}

/** Encode calldata for `transferFrom(from, to, amount)`. */
export function encodeTransferFrom(from: Address, to: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: "transferFrom",
    args: [from, to, amount],
  });
}

/** Encode calldata for `permit(owner, spender, value, deadline, v, r, s)`. */
export function encodePermit(
  owner: Address,
  spender: Address,
  value: bigint,
  deadline: bigint,
  v: number,
  r: Hex,
  s: Hex,
): Hex {
  return encodeFunctionData({
    abi: erc20PermitAbi,
    functionName: "permit",
    args: [owner, spender, value, deadline, v, r, s],
  });
}
