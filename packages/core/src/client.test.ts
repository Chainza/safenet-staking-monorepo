import { describe, expect, it, vi } from "vitest";
import { decodeFunctionData, type Account, type Chain, type PublicClient } from "viem";
import { stakingAbi } from "./abi/staking.js";
import { resolveConfig } from "./config.js";
import { createSafeStakeClient } from "./client.js";
import type { ConnectedWalletClient } from "./types.js";

const VALIDATOR = "0x1111111111111111111111111111111111111111" as const;
const STAKER = "0x2222222222222222222222222222222222222222" as const;

function makePublicClient(returnValue: unknown) {
  const readContract = vi.fn().mockResolvedValue(returnValue);
  return { client: { readContract } as unknown as PublicClient, readContract };
}

const account = { address: VALIDATOR, type: "json-rpc" } as unknown as Account;
const chain = { id: 1 } as unknown as Chain;

function makeWalletClient() {
  const writeContract = vi.fn().mockResolvedValue("0xhash");
  return {
    client: { writeContract, account, chain } as unknown as ConnectedWalletClient,
    writeContract,
  };
}

describe("createSafeStakeClient", () => {
  it("resolves config from an input (defaults to mainnet)", () => {
    const { client } = makePublicClient(0n);
    const sdk = createSafeStakeClient({ publicClient: client });
    expect(sdk.config.chainId).toBe(1);
    expect(sdk.config.addresses.staking).toBe(resolveConfig().addresses.staking);
  });

  it("accepts an already-resolved config unchanged", () => {
    const { client } = makePublicClient(0n);
    const resolved = resolveConfig({
      chainId: 1337,
      addresses: {
        staking: "0x1111111111111111111111111111111111111111",
        token: "0x2222222222222222222222222222222222222222",
      },
    });
    const sdk = createSafeStakeClient({ publicClient: client, config: resolved });
    expect(sdk.config).toBe(resolved);
  });

  it("routes reads through the public client", async () => {
    const { client, readContract } = makePublicClient(42n);
    const sdk = createSafeStakeClient({ publicClient: client });
    await expect(sdk.staking.getTotalStakedAmount()).resolves.toBe(42n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({ functionName: "totalStakedAmount" });

    await sdk.staking.getStake(STAKER, VALIDATOR);
    expect(readContract.mock.calls[1]![0]).toMatchObject({
      functionName: "stakes",
      args: [STAKER, VALIDATOR],
    });
  });

  it("routes writes through the wallet client when present", async () => {
    const { client } = makePublicClient(0n);
    const { client: wallet, writeContract } = makeWalletClient();
    const sdk = createSafeStakeClient({ publicClient: client, walletClient: wallet });
    await expect(sdk.staking.stake(VALIDATOR, 100n)).resolves.toBe("0xhash");
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "stake",
      args: [VALIDATOR, 100n],
    });
  });

  it("throws on a write when no wallet client was provided", () => {
    const { client } = makePublicClient(0n);
    const sdk = createSafeStakeClient({ publicClient: client });
    // fail-fast: the wallet guard throws synchronously when the method is called
    expect(() => sdk.staking.stake(VALIDATOR, 100n)).toThrow(/walletClient/i);
    expect(() => sdk.token.approve(100n)).toThrow(/walletClient/i);
  });

  it("exposes pure encode helpers regardless of wallet client", () => {
    const { client } = makePublicClient(0n);
    const sdk = createSafeStakeClient({ publicClient: client });
    const decoded = decodeFunctionData({
      abi: stakingAbi,
      data: sdk.staking.encodeStake(VALIDATOR, 100n),
    });
    expect(decoded.functionName).toBe("stake");
    expect(decoded.args).toEqual([VALIDATOR, 100n]);
  });
});
