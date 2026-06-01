import { describe, expect, it, vi } from "vitest";
import { decodeFunctionData, type Account, type Chain, type PublicClient } from "viem";
import { stakingAbi } from "./abi/staking.js";
import { resolveConfig } from "./config.js";
import type { ConnectedWalletClient } from "./types.js";
import * as staking from "./staking.js";

const config = resolveConfig(); // mainnet
const STAKING = config.addresses.staking;
const VALIDATOR = "0x1111111111111111111111111111111111111111" as const;
const STAKER = "0x2222222222222222222222222222222222222222" as const;

function readStub(returnValue: unknown) {
  const readContract = vi.fn().mockResolvedValue(returnValue);
  return { client: { readContract } as unknown as PublicClient, readContract };
}

const account = { address: VALIDATOR, type: "json-rpc" } as unknown as Account;
const chain = { id: 1 } as unknown as Chain;

function writeStub() {
  const writeContract = vi.fn().mockResolvedValue("0xhash");
  return {
    client: { writeContract, account, chain } as unknown as ConnectedWalletClient,
    writeContract,
  };
}

describe("staking reads", () => {
  it("getSafeToken", async () => {
    const { client, readContract } = readStub(VALIDATOR);
    await expect(staking.getSafeToken(client, config)).resolves.toBe(VALIDATOR);
    expect(readContract).toHaveBeenCalledWith({
      address: STAKING,
      abi: stakingAbi,
      functionName: "SAFE_TOKEN",
    });
  });

  it("getConfigTimeDelay", async () => {
    const { client, readContract } = readStub(100n);
    await expect(staking.getConfigTimeDelay(client, config)).resolves.toBe(100n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({ functionName: "CONFIG_TIME_DELAY" });
  });

  it("getTotalStakedAmount", async () => {
    const { client, readContract } = readStub(42n);
    await expect(staking.getTotalStakedAmount(client, config)).resolves.toBe(42n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      address: STAKING,
      functionName: "totalStakedAmount",
    });
  });

  it("getTotalPendingWithdrawals", async () => {
    const { client, readContract } = readStub(7n);
    await expect(staking.getTotalPendingWithdrawals(client, config)).resolves.toBe(7n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({ functionName: "totalPendingWithdrawals" });
  });

  it("getWithdrawDelay", async () => {
    const { client, readContract } = readStub(1209600n);
    await expect(staking.getWithdrawDelay(client, config)).resolves.toBe(1209600n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({ functionName: "withdrawDelay" });
  });

  it("getNextWithdrawalId", async () => {
    const { client, readContract } = readStub(3n);
    await expect(staking.getNextWithdrawalId(client, config)).resolves.toBe(3n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({ functionName: "nextWithdrawalId" });
  });

  it("isValidator", async () => {
    const { client, readContract } = readStub(true);
    await expect(staking.isValidator(client, config, VALIDATOR)).resolves.toBe(true);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "isValidator",
      args: [VALIDATOR],
    });
  });

  it("getTotalValidatorStakes", async () => {
    const { client, readContract } = readStub(99n);
    await expect(staking.getTotalValidatorStakes(client, config, VALIDATOR)).resolves.toBe(99n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "totalValidatorStakes",
      args: [VALIDATOR],
    });
  });

  it("getStake", async () => {
    const { client, readContract } = readStub(5n);
    await expect(staking.getStake(client, config, STAKER, VALIDATOR)).resolves.toBe(5n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "stakes",
      args: [STAKER, VALIDATOR],
    });
  });

  it("getTotalStakerStakes", async () => {
    const { client, readContract } = readStub(10n);
    await expect(staking.getTotalStakerStakes(client, config, STAKER)).resolves.toBe(10n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "totalStakerStakes",
      args: [STAKER],
    });
  });

  it("getWithdrawalQueue", async () => {
    const { client, readContract } = readStub([1n, 2n]);
    await expect(staking.getWithdrawalQueue(client, config, STAKER)).resolves.toEqual([1n, 2n]);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "withdrawalQueues",
      args: [STAKER],
    });
  });

  it("getPendingWithdrawals", async () => {
    const value = [{ amount: 1n, claimableAt: 2n }];
    const { client, readContract } = readStub(value);
    await expect(staking.getPendingWithdrawals(client, config, STAKER)).resolves.toEqual(value);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "getPendingWithdrawals",
      args: [STAKER],
    });
  });

  it("getNextClaimableWithdrawal", async () => {
    const { client, readContract } = readStub([1n, 2n]);
    await expect(staking.getNextClaimableWithdrawal(client, config, STAKER)).resolves.toEqual([
      1n, 2n,
    ]);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "getNextClaimableWithdrawal",
      args: [STAKER],
    });
  });

  it("getWithdrawalNode", async () => {
    const { client, readContract } = readStub([1n, 2n, 0n, 0n]);
    await expect(staking.getWithdrawalNode(client, config, STAKER, 1n)).resolves.toEqual([
      1n, 2n, 0n, 0n,
    ]);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "withdrawalNodes",
      args: [STAKER, 1n],
    });
  });

  it("getPendingWithdrawDelayChange", async () => {
    const { client, readContract } = readStub([100n, 200n]);
    await expect(staking.getPendingWithdrawDelayChange(client, config)).resolves.toEqual([
      100n, 200n,
    ]);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "pendingWithdrawDelayChange",
    });
  });

  it("getPendingValidatorChangeHash", async () => {
    const HASH = `0x${"aa".repeat(32)}`;
    const { client, readContract } = readStub(HASH);
    await expect(staking.getPendingValidatorChangeHash(client, config)).resolves.toBe(HASH);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "pendingValidatorChangeHash",
    });
  });

  it("getOwner", async () => {
    const { client, readContract } = readStub(VALIDATOR);
    await expect(staking.getOwner(client, config)).resolves.toBe(VALIDATOR);
    expect(readContract.mock.calls[0]![0]).toMatchObject({ address: STAKING, functionName: "owner" });
  });
});

describe("staking writes (send)", () => {
  it("stake passes args + account + chain and returns the tx hash", async () => {
    const { client, writeContract } = writeStub();
    await expect(staking.stake(client, config, VALIDATOR, 100n)).resolves.toBe("0xhash");
    expect(writeContract).toHaveBeenCalledWith({
      address: STAKING,
      abi: stakingAbi,
      functionName: "stake",
      args: [VALIDATOR, 100n],
      account,
      chain,
    });
  });

  it("initiateWithdrawal", async () => {
    const { client, writeContract } = writeStub();
    await staking.initiateWithdrawal(client, config, VALIDATOR, 50n);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "initiateWithdrawal",
      args: [VALIDATOR, 50n],
    });
  });

  it("initiateWithdrawalAtPosition", async () => {
    const { client, writeContract } = writeStub();
    await staking.initiateWithdrawalAtPosition(client, config, VALIDATOR, 50n, 3n);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "initiateWithdrawalAtPosition",
      args: [VALIDATOR, 50n, 3n],
    });
  });

  it("claimWithdrawal", async () => {
    const { client, writeContract } = writeStub();
    await staking.claimWithdrawal(client, config);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "claimWithdrawal",
      account,
      chain,
    });
  });

  it("proposeWithdrawDelay", async () => {
    const { client, writeContract } = writeStub();
    await staking.proposeWithdrawDelay(client, config, 1209600n);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "proposeWithdrawDelay",
      args: [1209600n],
    });
  });

  it("proposeValidators", async () => {
    const { client, writeContract } = writeStub();
    await staking.proposeValidators(client, config, [VALIDATOR], [true]);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "proposeValidators",
      args: [[VALIDATOR], [true]],
    });
  });

  it("executeWithdrawDelayChange", async () => {
    const { client, writeContract } = writeStub();
    await staking.executeWithdrawDelayChange(client, config);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "executeWithdrawDelayChange",
    });
  });

  it("executeValidatorChanges", async () => {
    const { client, writeContract } = writeStub();
    await staking.executeValidatorChanges(client, config, [VALIDATOR], [false], 42n);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "executeValidatorChanges",
      args: [[VALIDATOR], [false], 42n],
    });
  });

  it("recoverTokens", async () => {
    const { client, writeContract } = writeStub();
    await staking.recoverTokens(client, config, STAKING, VALIDATOR);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "recoverTokens",
      args: [STAKING, VALIDATOR],
    });
  });

  it("transferOwnership", async () => {
    const { client, writeContract } = writeStub();
    await staking.transferOwnership(client, config, VALIDATOR);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "transferOwnership",
      args: [VALIDATOR],
    });
  });

  it("renounceOwnership", async () => {
    const { client, writeContract } = writeStub();
    await staking.renounceOwnership(client, config);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "renounceOwnership",
      account,
      chain,
    });
  });
});

describe("staking writes (encode)", () => {
  it("encodeStake round-trips", () => {
    const decoded = decodeFunctionData({ abi: stakingAbi, data: staking.encodeStake(VALIDATOR, 100n) });
    expect(decoded.functionName).toBe("stake");
    expect(decoded.args).toEqual([VALIDATOR, 100n]);
  });

  it("encodeInitiateWithdrawal round-trips", () => {
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: staking.encodeInitiateWithdrawal(VALIDATOR, 50n),
    });
    expect(decoded.functionName).toBe("initiateWithdrawal");
    expect(decoded.args).toEqual([VALIDATOR, 50n]);
  });

  it("encodeClaimWithdrawal round-trips", () => {
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: staking.encodeClaimWithdrawal(),
    });
    expect(decoded.functionName).toBe("claimWithdrawal");
  });

  it("encodeInitiateWithdrawalAtPosition round-trips", () => {
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: staking.encodeInitiateWithdrawalAtPosition(VALIDATOR, 50n, 3n),
    });
    expect(decoded.functionName).toBe("initiateWithdrawalAtPosition");
    expect(decoded.args).toEqual([VALIDATOR, 50n, 3n]);
  });

  it("encodeProposeWithdrawDelay round-trips", () => {
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: staking.encodeProposeWithdrawDelay(1209600n),
    });
    expect(decoded.functionName).toBe("proposeWithdrawDelay");
    expect(decoded.args).toEqual([1209600n]);
  });

  it("encodeProposeValidators round-trips", () => {
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: staking.encodeProposeValidators([VALIDATOR], [true]),
    });
    expect(decoded.functionName).toBe("proposeValidators");
    expect(decoded.args).toEqual([[VALIDATOR], [true]]);
  });

  it("encodeExecuteWithdrawDelayChange round-trips", () => {
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: staking.encodeExecuteWithdrawDelayChange(),
    });
    expect(decoded.functionName).toBe("executeWithdrawDelayChange");
  });

  it("encodeExecuteValidatorChanges round-trips", () => {
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: staking.encodeExecuteValidatorChanges([VALIDATOR], [false], 42n),
    });
    expect(decoded.functionName).toBe("executeValidatorChanges");
    expect(decoded.args).toEqual([[VALIDATOR], [false], 42n]);
  });

  it("encodeRecoverTokens round-trips", () => {
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: staking.encodeRecoverTokens(STAKING, VALIDATOR),
    });
    expect(decoded.functionName).toBe("recoverTokens");
    expect(decoded.args).toEqual([STAKING, VALIDATOR]);
  });

  it("encodeTransferOwnership round-trips", () => {
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: staking.encodeTransferOwnership(VALIDATOR),
    });
    expect(decoded.functionName).toBe("transferOwnership");
    expect(decoded.args).toEqual([VALIDATOR]);
  });

  it("encodeRenounceOwnership round-trips", () => {
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: staking.encodeRenounceOwnership(),
    });
    expect(decoded.functionName).toBe("renounceOwnership");
  });
});
