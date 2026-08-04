import { describe, expect, it, vi } from "vitest";
import type { PublicClient } from "viem";
import { resolveConfig } from "./config.js";
import * as sanctions from "./sanctions.js";

const config = resolveConfig(); // mainnet
const SANCTIONS_LIST = config.addresses.sanctionsList;
const ACCOUNT = "0x1111111111111111111111111111111111111111" as const;

function readStub(returnValue: unknown) {
  const readContract = vi.fn().mockResolvedValue(returnValue);
  return { client: { readContract } as unknown as PublicClient, readContract };
}

describe("sanctions reads", () => {
  it("isSanctioned targets the SanctionsList oracle with the account", async () => {
    const { client, readContract } = readStub(false);
    await expect(sanctions.isSanctioned(client, config, ACCOUNT)).resolves.toBe(false);
    expect(readContract.mock.calls[0]![0]).toMatchObject({
      address: SANCTIONS_LIST,
      functionName: "isSanctioned",
      args: [ACCOUNT],
    });
  });

  it("surfaces a flagged address as true", async () => {
    const { client } = readStub(true);
    await expect(sanctions.isSanctioned(client, config, ACCOUNT)).resolves.toBe(true);
  });
});
