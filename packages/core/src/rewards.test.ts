import { describe, expect, it, vi } from "vitest";
import { decodeFunctionData, type Account, type Chain, type PublicClient } from "viem";
import { merkleDropAbi } from "./abi/merkleDrop.js";
import { resolveConfig } from "./config.js";
import type { ConnectedWalletClient } from "./types.js";
import * as rewards from "./rewards.js";

const config = resolveConfig(); // mainnet
const MERKLE_DROP = config.addresses.merkleDrop;
const ACCOUNT = "0x1111111111111111111111111111111111111111" as const;
const ROOT = `0x${"aa".repeat(32)}` as const;
const PROOF = [`0x${"bb".repeat(32)}`, `0x${"cc".repeat(32)}`] as const;

function readStub(returnValue: unknown) {
  const readContract = vi.fn().mockResolvedValue(returnValue);
  return { client: { readContract } as unknown as PublicClient, readContract };
}

const account = { address: ACCOUNT, type: "json-rpc" } as unknown as Account;
const chain = { id: 1 } as unknown as Chain;

function writeStub() {
  const writeContract = vi.fn().mockResolvedValue("0xhash");
  return {
    client: { writeContract, account, chain } as unknown as ConnectedWalletClient,
    writeContract,
  };
}

describe("rewards reads", () => {
  it("getMerkleRoot targets the MerkleDrop address", async () => {
    const { client, readContract } = readStub(ROOT);
    await expect(rewards.getMerkleRoot(client, config)).resolves.toBe(ROOT);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      address: MERKLE_DROP,
      functionName: "merkleRoot",
    });
  });

  it("getCumulativeClaimed", async () => {
    const { client, readContract } = readStub(500n);
    await expect(rewards.getCumulativeClaimed(client, config, ACCOUNT)).resolves.toBe(500n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      address: MERKLE_DROP,
      functionName: "cumulativeClaimed",
      args: [ACCOUNT],
    });
  });
});

describe("rewards writes (send)", () => {
  it("claim sends account, cumulative amount, expected root and proof", async () => {
    const { client, writeContract } = writeStub();
    await expect(rewards.claim(client, config, ACCOUNT, 1000n, ROOT, PROOF)).resolves.toBe(
      "0xhash",
    );
    expect(writeContract).toHaveBeenCalledWith({
      address: MERKLE_DROP,
      abi: merkleDropAbi,
      functionName: "claim",
      args: [ACCOUNT, 1000n, ROOT, PROOF],
      account,
      chain,
    });
  });
});

describe("rewards writes (encode)", () => {
  it("encodeClaim round-trips", () => {
    const decoded = decodeFunctionData({
      abi: merkleDropAbi,
      data: rewards.encodeClaim(ACCOUNT, 1000n, ROOT, PROOF),
    });
    expect(decoded.functionName).toBe("claim");
    expect(decoded.args).toEqual([ACCOUNT, 1000n, ROOT, PROOF]);
  });
});
