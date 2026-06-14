import { describe, expect, it, vi } from "vitest";
import { decodeFunctionData, type Account, type Chain, type PublicClient } from "viem";
import { erc20Abi, erc20PermitAbi } from "./abi/erc20.js";
import { resolveConfig } from "./config.js";
import type { ConnectedWalletClient } from "./types.js";
import * as token from "./token.js";

const config = resolveConfig(); // mainnet
const TOKEN = config.addresses.token;
const STAKING = config.addresses.staking;
const OWNER = "0x1111111111111111111111111111111111111111" as const;
const SPENDER = "0x2222222222222222222222222222222222222222" as const;
const RECIPIENT = "0x3333333333333333333333333333333333333333" as const;

function readStub(returnValue: unknown) {
  const readContract = vi.fn().mockResolvedValue(returnValue);
  return { client: { readContract } as unknown as PublicClient, readContract };
}

const account = { address: OWNER, type: "json-rpc" } as unknown as Account;
const chain = { id: 1 } as unknown as Chain;

function writeStub() {
  const writeContract = vi.fn().mockResolvedValue("0xhash");
  return {
    client: { writeContract, account, chain } as unknown as ConnectedWalletClient,
    writeContract,
  };
}

describe("token reads", () => {
  it("getTokenName / Symbol / Decimals target the token address", async () => {
    const name = readStub("Safe Token");
    await expect(token.getTokenName(name.client, config)).resolves.toBe("Safe Token");
    expect(name.readContract.mock.calls[0]![0]).toMatchObject({
      address: TOKEN,
      functionName: "name",
    });

    const symbol = readStub("SAFE");
    await expect(token.getTokenSymbol(symbol.client, config)).resolves.toBe("SAFE");
    expect(symbol.readContract.mock.calls[0]![0]).toMatchObject({ functionName: "symbol" });

    const decimals = readStub(18);
    await expect(token.getTokenDecimals(decimals.client, config)).resolves.toBe(18);
    expect(decimals.readContract.mock.calls[0]![0]).toMatchObject({ functionName: "decimals" });
  });

  it("getTotalSupply", async () => {
    const { client, readContract } = readStub(1_000_000n);
    await expect(token.getTotalSupply(client, config)).resolves.toBe(1_000_000n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      address: TOKEN,
      functionName: "totalSupply",
    });
  });

  it("getBalance", async () => {
    const { client, readContract } = readStub(1000n);
    await expect(token.getBalance(client, config, OWNER)).resolves.toBe(1000n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "balanceOf",
      args: [OWNER],
    });
  });

  it("getAllowance defaults spender to the staking contract", async () => {
    const { client, readContract } = readStub(5n);
    await token.getAllowance(client, config, OWNER);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      functionName: "allowance",
      args: [OWNER, STAKING],
    });
  });

  it("getAllowance accepts an explicit spender", async () => {
    const { client, readContract } = readStub(5n);
    await token.getAllowance(client, config, OWNER, SPENDER);
    expect(readContract.mock.calls[0]![0]).toMatchObject({ args: [OWNER, SPENDER] });
  });

  it("getNonce (ERC-2612)", async () => {
    const { client, readContract } = readStub(3n);
    await expect(token.getNonce(client, config, OWNER)).resolves.toBe(3n);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      address: TOKEN,
      functionName: "nonces",
      args: [OWNER],
    });
  });

  it("getDomainSeparator (ERC-2612)", async () => {
    const DS = `0x${"bb".repeat(32)}`;
    const { client, readContract } = readStub(DS);
    await expect(token.getDomainSeparator(client, config)).resolves.toBe(DS);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      address: TOKEN,
      functionName: "DOMAIN_SEPARATOR",
    });
  });

  it("getTokenMeta batches name/symbol/decimals into one multicall", async () => {
    const multicall = vi.fn().mockResolvedValue(["Safe Token", "SAFE", 18]);
    const client = { multicall } as unknown as PublicClient;
    await expect(token.getTokenMeta(client, config)).resolves.toEqual({
      name: "Safe Token",
      symbol: "SAFE",
      decimals: 18,
    });
    // One round trip, allowFailure off, all three calls aimed at the token.
    expect(multicall).toHaveBeenCalledTimes(1);
    const arg = multicall.mock.calls[0]![0];
    expect(arg.allowFailure).toBe(false);
    expect(arg.contracts).toMatchObject([
      { address: TOKEN, functionName: "name" },
      { address: TOKEN, functionName: "symbol" },
      { address: TOKEN, functionName: "decimals" },
    ]);
  });
});

describe("token writes (send)", () => {
  it("approve defaults spender to staking", async () => {
    const { client, writeContract } = writeStub();
    await expect(token.approve(client, config, 100n)).resolves.toBe("0xhash");
    expect(writeContract).toHaveBeenCalledWith({
      address: TOKEN,
      abi: erc20Abi,
      functionName: "approve",
      args: [STAKING, 100n],
      account,
      chain,
    });
  });

  it("approve accepts an explicit spender", async () => {
    const { client, writeContract } = writeStub();
    await token.approve(client, config, 100n, SPENDER);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({ args: [SPENDER, 100n] });
  });

  it("transfer", async () => {
    const { client, writeContract } = writeStub();
    await token.transfer(client, config, RECIPIENT, 25n);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "transfer",
      args: [RECIPIENT, 25n],
    });
  });

  it("transferFrom", async () => {
    const { client, writeContract } = writeStub();
    await token.transferFrom(client, config, OWNER, RECIPIENT, 25n);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      functionName: "transferFrom",
      args: [OWNER, RECIPIENT, 25n],
    });
  });

  it("permit (ERC-2612)", async () => {
    const R = `0x${"11".repeat(32)}` as const;
    const S = `0x${"22".repeat(32)}` as const;
    const { client, writeContract } = writeStub();
    await token.permit(client, config, OWNER, STAKING, 100n, 9999n, 27, R, S);
    expect(writeContract.mock.calls[0]![0]).toMatchObject({
      address: TOKEN,
      functionName: "permit",
      args: [OWNER, STAKING, 100n, 9999n, 27, R, S],
    });
  });
});

describe("token writes (encode)", () => {
  it("encodeApprove round-trips", () => {
    const decoded = decodeFunctionData({
      abi: erc20Abi,
      data: token.encodeApprove(STAKING, 100n),
    });
    expect(decoded.functionName).toBe("approve");
    expect(decoded.args).toEqual([STAKING, 100n]);
  });

  it("encodeTransfer round-trips", () => {
    const decoded = decodeFunctionData({
      abi: erc20Abi,
      data: token.encodeTransfer(RECIPIENT, 25n),
    });
    expect(decoded.functionName).toBe("transfer");
    expect(decoded.args).toEqual([RECIPIENT, 25n]);
  });

  it("encodeTransferFrom round-trips", () => {
    const decoded = decodeFunctionData({
      abi: erc20Abi,
      data: token.encodeTransferFrom(OWNER, RECIPIENT, 25n),
    });
    expect(decoded.functionName).toBe("transferFrom");
    expect(decoded.args).toEqual([OWNER, RECIPIENT, 25n]);
  });

  it("encodePermit round-trips", () => {
    const R = `0x${"11".repeat(32)}` as const;
    const S = `0x${"22".repeat(32)}` as const;
    const decoded = decodeFunctionData({
      abi: erc20PermitAbi,
      data: token.encodePermit(OWNER, STAKING, 100n, 9999n, 27, R, S),
    });
    expect(decoded.functionName).toBe("permit");
    expect(decoded.args).toEqual([OWNER, STAKING, 100n, 9999n, 27, R, S]);
  });
});
