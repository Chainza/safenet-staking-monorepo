import { encodeFunctionData, type Address, type Hash, type Hex, type PublicClient } from "viem";
import { stakingAbi } from "./abi/staking.js";
import type { SafeStakeConfig } from "./config.js";
import type { ConnectedWalletClient } from "./types.js";

// ---------------------------------------------------------------------------
// Reads — each takes a consumer-provided PublicClient + resolved config.
// ---------------------------------------------------------------------------

/** Address of the SAFE token the staking contract operates on. */
export function getSafeToken(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "SAFE_TOKEN",
  });
}

/** The governance config time delay (seconds) for parameter changes. */
export function getConfigTimeDelay(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "CONFIG_TIME_DELAY",
  });
}

/** Total SAFE currently staked across all validators. */
export function getTotalStakedAmount(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "totalStakedAmount",
  });
}

/** Total SAFE sitting in pending (not-yet-claimed) withdrawals. */
export function getTotalPendingWithdrawals(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "totalPendingWithdrawals",
  });
}

/** Current withdrawal delay (seconds) between initiating and claiming. */
export function getWithdrawDelay(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "withdrawDelay",
  });
}

/** The id that will be assigned to the next withdrawal. */
export function getNextWithdrawalId(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "nextWithdrawalId",
  });
}

/** Whether `validator` is a registered validator. */
export function isValidator(client: PublicClient, config: SafeStakeConfig, validator: Address) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "isValidator",
    args: [validator],
  });
}

/** Total SAFE staked on a single validator. */
export function getTotalValidatorStakes(
  client: PublicClient,
  config: SafeStakeConfig,
  validator: Address,
) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "totalValidatorStakes",
    args: [validator],
  });
}

/** Amount `staker` has staked on a specific `validator`. */
export function getStake(
  client: PublicClient,
  config: SafeStakeConfig,
  staker: Address,
  validator: Address,
) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "stakes",
    args: [staker, validator],
  });
}

/** Total amount `staker` has staked across all validators. */
export function getTotalStakerStakes(
  client: PublicClient,
  config: SafeStakeConfig,
  staker: Address,
) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "totalStakerStakes",
    args: [staker],
  });
}

/** Head and tail pointers of a staker's withdrawal queue: `[head, tail]`. */
export function getWithdrawalQueue(client: PublicClient, config: SafeStakeConfig, staker: Address) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "withdrawalQueues",
    args: [staker],
  });
}

/** All pending withdrawals for a staker (amount + claimableAt per entry). */
export function getPendingWithdrawals(
  client: PublicClient,
  config: SafeStakeConfig,
  staker: Address,
) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "getPendingWithdrawals",
    args: [staker],
  });
}

/** The next claimable withdrawal for a staker: `[amount, claimableAt]`. */
export function getNextClaimableWithdrawal(
  client: PublicClient,
  config: SafeStakeConfig,
  staker: Address,
) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "getNextClaimableWithdrawal",
    args: [staker],
  });
}

/** A specific node in a staker's withdrawal linked-list by id. */
export function getWithdrawalNode(
  client: PublicClient,
  config: SafeStakeConfig,
  staker: Address,
  withdrawalId: bigint,
) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "withdrawalNodes",
    args: [staker, withdrawalId],
  });
}

/** Pending withdraw-delay change proposal: `[value, executableAt]` (0 if none). */
export function getPendingWithdrawDelayChange(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "pendingWithdrawDelayChange",
  });
}

/** Hash of the currently pending validator-change proposal (0x0 if none). */
export function getPendingValidatorChangeHash(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "pendingValidatorChangeHash",
  });
}

/** Current owner of the staking contract (governs config + validator changes). */
export function getOwner(client: PublicClient, config: SafeStakeConfig) {
  return client.readContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "owner",
  });
}

// ---------------------------------------------------------------------------
// Writes (send) — each takes a connected WalletClient and returns the tx hash.
// ---------------------------------------------------------------------------

/** Stake `amount` of SAFE on `validator`. Requires prior token approval. */
export function stake(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  validator: Address,
  amount: bigint,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "stake",
    args: [validator, amount],
    account: client.account,
    chain: client.chain,
  });
}

/** Begin unstaking `amount` of SAFE from `validator` (enters the withdrawal queue). */
export function initiateWithdrawal(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  validator: Address,
  amount: bigint,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "initiateWithdrawal",
    args: [validator, amount],
    account: client.account,
    chain: client.chain,
  });
}

/**
 * Begin unstaking `amount` from `validator`, inserting the withdrawal after
 * `previousId` in the sorted queue (gas-efficient alternative to
 * `initiateWithdrawal`; pass `0n` to insert at the head).
 */
export function initiateWithdrawalAtPosition(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  validator: Address,
  amount: bigint,
  previousId: bigint,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "initiateWithdrawalAtPosition",
    args: [validator, amount, previousId],
    account: client.account,
    chain: client.chain,
  });
}

/** Claim the next matured withdrawal from the queue. */
export function claimWithdrawal(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "claimWithdrawal",
    account: client.account,
    chain: client.chain,
  });
}

/** Propose a new withdraw delay (owner-only on-chain). */
export function proposeWithdrawDelay(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  newDelay: bigint,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "proposeWithdrawDelay",
    args: [newDelay],
    account: client.account,
    chain: client.chain,
  });
}

/** Propose validator registration/deregistration changes (owner-only on-chain). */
export function proposeValidators(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  validators: readonly Address[],
  isRegistration: readonly boolean[],
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "proposeValidators",
    args: [validators, isRegistration],
    account: client.account,
    chain: client.chain,
  });
}

/** Execute a previously proposed withdraw-delay change once its timelock elapses. */
export function executeWithdrawDelayChange(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "executeWithdrawDelayChange",
    account: client.account,
    chain: client.chain,
  });
}

/** Execute previously proposed validator changes once their timelock elapses. */
export function executeValidatorChanges(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  validators: readonly Address[],
  isRegistration: readonly boolean[],
  executableAt: bigint,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "executeValidatorChanges",
    args: [validators, isRegistration, executableAt],
    account: client.account,
    chain: client.chain,
  });
}

/** Recover accidentally-sent tokens to `to` (owner-only on-chain). */
export function recoverTokens(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  token: Address,
  to: Address,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "recoverTokens",
    args: [token, to],
    account: client.account,
    chain: client.chain,
  });
}

/** Transfer ownership of the staking contract to `newOwner` (owner-only on-chain). */
export function transferOwnership(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
  newOwner: Address,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "transferOwnership",
    args: [newOwner],
    account: client.account,
    chain: client.chain,
  });
}

/** Renounce ownership of the staking contract (owner-only on-chain; irreversible). */
export function renounceOwnership(
  client: ConnectedWalletClient,
  config: SafeStakeConfig,
): Promise<Hash> {
  return client.writeContract({
    address: config.addresses.staking,
    abi: stakingAbi,
    functionName: "renounceOwnership",
    account: client.account,
    chain: client.chain,
  });
}

// ---------------------------------------------------------------------------
// Writes (encode) — pure calldata builders for batching (e.g. Safe / EIP-5792).
// ---------------------------------------------------------------------------

/** Encode calldata for `stake(validator, amount)`. */
export function encodeStake(validator: Address, amount: bigint): Hex {
  return encodeFunctionData({ abi: stakingAbi, functionName: "stake", args: [validator, amount] });
}

/** Encode calldata for `initiateWithdrawal(validator, amount)`. */
export function encodeInitiateWithdrawal(validator: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: stakingAbi,
    functionName: "initiateWithdrawal",
    args: [validator, amount],
  });
}

/** Encode calldata for `initiateWithdrawalAtPosition(validator, amount, previousId)`. */
export function encodeInitiateWithdrawalAtPosition(
  validator: Address,
  amount: bigint,
  previousId: bigint,
): Hex {
  return encodeFunctionData({
    abi: stakingAbi,
    functionName: "initiateWithdrawalAtPosition",
    args: [validator, amount, previousId],
  });
}

/** Encode calldata for `claimWithdrawal()`. */
export function encodeClaimWithdrawal(): Hex {
  return encodeFunctionData({ abi: stakingAbi, functionName: "claimWithdrawal" });
}

/** Encode calldata for `proposeWithdrawDelay(newDelay)`. */
export function encodeProposeWithdrawDelay(newDelay: bigint): Hex {
  return encodeFunctionData({
    abi: stakingAbi,
    functionName: "proposeWithdrawDelay",
    args: [newDelay],
  });
}

/** Encode calldata for `proposeValidators(validators, isRegistration)`. */
export function encodeProposeValidators(
  validators: readonly Address[],
  isRegistration: readonly boolean[],
): Hex {
  return encodeFunctionData({
    abi: stakingAbi,
    functionName: "proposeValidators",
    args: [validators, isRegistration],
  });
}

/** Encode calldata for `executeWithdrawDelayChange()`. */
export function encodeExecuteWithdrawDelayChange(): Hex {
  return encodeFunctionData({ abi: stakingAbi, functionName: "executeWithdrawDelayChange" });
}

/** Encode calldata for `executeValidatorChanges(validators, isRegistration, executableAt)`. */
export function encodeExecuteValidatorChanges(
  validators: readonly Address[],
  isRegistration: readonly boolean[],
  executableAt: bigint,
): Hex {
  return encodeFunctionData({
    abi: stakingAbi,
    functionName: "executeValidatorChanges",
    args: [validators, isRegistration, executableAt],
  });
}

/** Encode calldata for `recoverTokens(token, to)`. */
export function encodeRecoverTokens(token: Address, to: Address): Hex {
  return encodeFunctionData({
    abi: stakingAbi,
    functionName: "recoverTokens",
    args: [token, to],
  });
}

/** Encode calldata for `transferOwnership(newOwner)`. */
export function encodeTransferOwnership(newOwner: Address): Hex {
  return encodeFunctionData({
    abi: stakingAbi,
    functionName: "transferOwnership",
    args: [newOwner],
  });
}

/** Encode calldata for `renounceOwnership()`. */
export function encodeRenounceOwnership(): Hex {
  return encodeFunctionData({ abi: stakingAbi, functionName: "renounceOwnership" });
}
