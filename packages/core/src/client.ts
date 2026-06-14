import type { Address, Hex, PublicClient } from "viem";
import {
  isResolvedConfig,
  resolveConfig,
  type SafeStakeConfig,
  type SafeStakeConfigInput,
} from "./config.js";
import type { ConnectedWalletClient } from "./types.js";
import * as staking from "./staking.js";
import * as token from "./token.js";

export interface CreateSafeStakeClientParams {
  /** Consumer-provided viem public client, used for all reads. */
  publicClient: PublicClient;
  /**
   * Consumer-provided connected viem wallet client, used for all writes.
   * Optional — read-only consumers can omit it; calling a write without it
   * throws a descriptive error.
   */
  walletClient?: ConnectedWalletClient;
  /**
   * Either a resolved {@link SafeStakeConfig} or a {@link SafeStakeConfigInput}
   * to resolve. Omit to target mainnet defaults.
   */
  config?: SafeStakeConfig | SafeStakeConfigInput;
}

/**
 * Bind a public client (and optionally a wallet client) plus a resolved config
 * once, returning grouped, pre-bound contract methods. This is the ergonomic
 * surface for consumers (and the widget); the standalone functions in
 * `staking`/`token`/`rewards` remain available for tree-shaking.
 *
 * The package never creates viem clients — they are always supplied here.
 */
export function createSafeStakeClient(params: CreateSafeStakeClientParams) {
  const { publicClient, walletClient } = params;
  const config: SafeStakeConfig =
    params.config && isResolvedConfig(params.config) ? params.config : resolveConfig(params.config);

  const requireWallet = (): ConnectedWalletClient => {
    if (!walletClient) {
      throw new Error(
        "This operation requires a walletClient. Pass one to createSafeStakeClient({ walletClient }).",
      );
    }
    return walletClient;
  };

  return {
    config,

    staking: {
      // reads
      getSafeToken: () => staking.getSafeToken(publicClient, config),
      getConfigTimeDelay: () => staking.getConfigTimeDelay(publicClient, config),
      getTotalStakedAmount: () => staking.getTotalStakedAmount(publicClient, config),
      getTotalPendingWithdrawals: () => staking.getTotalPendingWithdrawals(publicClient, config),
      getWithdrawDelay: () => staking.getWithdrawDelay(publicClient, config),
      getNextWithdrawalId: () => staking.getNextWithdrawalId(publicClient, config),
      isValidator: (validator: Address) => staking.isValidator(publicClient, config, validator),
      getTotalValidatorStakes: (validator: Address) =>
        staking.getTotalValidatorStakes(publicClient, config, validator),
      getStake: (staker: Address, validator: Address) =>
        staking.getStake(publicClient, config, staker, validator),
      getTotalStakerStakes: (staker: Address) =>
        staking.getTotalStakerStakes(publicClient, config, staker),
      getWithdrawalQueue: (staker: Address) =>
        staking.getWithdrawalQueue(publicClient, config, staker),
      getPendingWithdrawals: (staker: Address) =>
        staking.getPendingWithdrawals(publicClient, config, staker),
      getNextClaimableWithdrawal: (staker: Address) =>
        staking.getNextClaimableWithdrawal(publicClient, config, staker),
      getWithdrawalNode: (staker: Address, withdrawalId: bigint) =>
        staking.getWithdrawalNode(publicClient, config, staker, withdrawalId),
      getPendingWithdrawDelayChange: () =>
        staking.getPendingWithdrawDelayChange(publicClient, config),
      getPendingValidatorChangeHash: () =>
        staking.getPendingValidatorChangeHash(publicClient, config),
      getOwner: () => staking.getOwner(publicClient, config),
      // writes (send)
      stake: (validator: Address, amount: bigint) =>
        staking.stake(requireWallet(), config, validator, amount),
      initiateWithdrawal: (validator: Address, amount: bigint) =>
        staking.initiateWithdrawal(requireWallet(), config, validator, amount),
      initiateWithdrawalAtPosition: (validator: Address, amount: bigint, previousId: bigint) =>
        staking.initiateWithdrawalAtPosition(
          requireWallet(),
          config,
          validator,
          amount,
          previousId,
        ),
      claimWithdrawal: () => staking.claimWithdrawal(requireWallet(), config),
      proposeWithdrawDelay: (newDelay: bigint) =>
        staking.proposeWithdrawDelay(requireWallet(), config, newDelay),
      proposeValidators: (validators: readonly Address[], isRegistration: readonly boolean[]) =>
        staking.proposeValidators(requireWallet(), config, validators, isRegistration),
      executeWithdrawDelayChange: () => staking.executeWithdrawDelayChange(requireWallet(), config),
      executeValidatorChanges: (
        validators: readonly Address[],
        isRegistration: readonly boolean[],
        executableAt: bigint,
      ) =>
        staking.executeValidatorChanges(
          requireWallet(),
          config,
          validators,
          isRegistration,
          executableAt,
        ),
      recoverTokens: (tokenAddress: Address, to: Address) =>
        staking.recoverTokens(requireWallet(), config, tokenAddress, to),
      transferOwnership: (newOwner: Address) =>
        staking.transferOwnership(requireWallet(), config, newOwner),
      renounceOwnership: () => staking.renounceOwnership(requireWallet(), config),
      // writes (encode)
      encodeStake: staking.encodeStake,
      encodeInitiateWithdrawal: staking.encodeInitiateWithdrawal,
      encodeInitiateWithdrawalAtPosition: staking.encodeInitiateWithdrawalAtPosition,
      encodeClaimWithdrawal: staking.encodeClaimWithdrawal,
      encodeProposeWithdrawDelay: staking.encodeProposeWithdrawDelay,
      encodeProposeValidators: staking.encodeProposeValidators,
      encodeExecuteWithdrawDelayChange: staking.encodeExecuteWithdrawDelayChange,
      encodeExecuteValidatorChanges: staking.encodeExecuteValidatorChanges,
      encodeRecoverTokens: staking.encodeRecoverTokens,
      encodeTransferOwnership: staking.encodeTransferOwnership,
      encodeRenounceOwnership: staking.encodeRenounceOwnership,
    },

    token: {
      // reads
      getName: () => token.getTokenName(publicClient, config),
      getSymbol: () => token.getTokenSymbol(publicClient, config),
      getDecimals: () => token.getTokenDecimals(publicClient, config),
      getMeta: () => token.getTokenMeta(publicClient, config),
      getTotalSupply: () => token.getTotalSupply(publicClient, config),
      getBalance: (owner: Address) => token.getBalance(publicClient, config, owner),
      getAllowance: (owner: Address, spender?: Address) =>
        token.getAllowance(publicClient, config, owner, spender),
      // reads (ERC-2612 permit)
      getNonce: (owner: Address) => token.getNonce(publicClient, config, owner),
      getDomainSeparator: () => token.getDomainSeparator(publicClient, config),
      // writes (send)
      approve: (amount: bigint, spender?: Address) =>
        token.approve(requireWallet(), config, amount, spender),
      transfer: (to: Address, amount: bigint) =>
        token.transfer(requireWallet(), config, to, amount),
      transferFrom: (from: Address, to: Address, amount: bigint) =>
        token.transferFrom(requireWallet(), config, from, to, amount),
      permit: (
        owner: Address,
        spender: Address,
        value: bigint,
        deadline: bigint,
        v: number,
        r: Hex,
        s: Hex,
      ) => token.permit(requireWallet(), config, owner, spender, value, deadline, v, r, s),
      // writes (encode)
      encodeApprove: token.encodeApprove,
      encodeTransfer: token.encodeTransfer,
      encodeTransferFrom: token.encodeTransferFrom,
      encodePermit: token.encodePermit,
    },
  };
}

export type SafeStakeClient = ReturnType<typeof createSafeStakeClient>;
