import { describe, expect, it } from "vitest";
import { getAddress } from "viem";
import { DEFAULT_CHAIN_ID, KNOWN_DEPLOYMENTS, isResolvedConfig, resolveConfig } from "./config.js";

const MAINNET_STAKING = "0x115E78f160e1E3eF163B05C84562Fa16fA338509";
const MAINNET_TOKEN = "0x5aFE3855358E112B5647B952709E6165e1c1eEEe";
const MAINNET_MERKLE_DROP = "0xe5139Fc0FB8eae81e30d8a85C22E88c6757120f2";
const LOWERCASE_TOKEN = "0xef98bcc90b1373b2ae0d23ec318d3ee70ea61af4";

describe("resolveConfig", () => {
  it("defaults to mainnet (chain 1) with built-in addresses", () => {
    const config = resolveConfig();
    expect(config.chainId).toBe(DEFAULT_CHAIN_ID);
    expect(config.chainId).toBe(1);
    expect(config.addresses.staking).toBe(MAINNET_STAKING);
    expect(config.addresses.token).toBe(MAINNET_TOKEN);
    expect(config.addresses.merkleDrop).toBe(MAINNET_MERKLE_DROP);
  });

  it("mainnet is a known deployment", () => {
    expect(KNOWN_DEPLOYMENTS[1]!.staking).toBe(MAINNET_STAKING);
  });

  it("normalises (checksums) addresses via getAddress", () => {
    // a lowercase override address must be checksummed on resolve
    const config = resolveConfig({ addresses: { token: LOWERCASE_TOKEN } });
    expect(config.addresses.token).toBe(getAddress(LOWERCASE_TOKEN));
    expect(config.addresses.token).not.toBe(LOWERCASE_TOKEN);
  });

  it("merges per-address overrides on top of defaults (overrides win)", () => {
    const token = "0x1111111111111111111111111111111111111111";
    const config = resolveConfig({ chainId: 1, addresses: { token } });
    expect(config.addresses.staking).toBe(MAINNET_STAKING); // default kept
    expect(config.addresses.token).toBe(getAddress(token)); // override applied
  });

  it("allows a fully custom chain via address overrides", () => {
    const staking = "0x2222222222222222222222222222222222222222";
    const token = "0x3333333333333333333333333333333333333333";
    const merkleDrop = "0x4444444444444444444444444444444444444444";
    const config = resolveConfig({ chainId: 1337, addresses: { staking, token, merkleDrop } });
    expect(config.chainId).toBe(1337);
    expect(config.addresses.staking).toBe(getAddress(staking));
    expect(config.addresses.token).toBe(getAddress(token));
    expect(config.addresses.merkleDrop).toBe(getAddress(merkleDrop));
  });

  it("checksums a merkleDrop override when provided", () => {
    const merkleDrop = "0xe5139fc0fb8eae81e30d8a85c22e88c6757120f2";
    const config = resolveConfig({ addresses: { merkleDrop } });
    expect(config.addresses.merkleDrop).toBe(MAINNET_MERKLE_DROP);
  });

  it("throws for an unknown chain with no address overrides", () => {
    expect(() => resolveConfig({ chainId: 999999 })).toThrow(/staking address/i);
  });

  it("throws when the token address cannot be determined", () => {
    const staking = "0x2222222222222222222222222222222222222222";
    expect(() => resolveConfig({ chainId: 999999, addresses: { staking } })).toThrow(
      /token address/i,
    );
  });

  it("throws when the merkleDrop address cannot be determined", () => {
    const staking = "0x2222222222222222222222222222222222222222";
    const token = "0x3333333333333333333333333333333333333333";
    expect(() => resolveConfig({ chainId: 999999, addresses: { staking, token } })).toThrow(
      /merkleDrop address/,
    );
  });
});

describe("isResolvedConfig", () => {
  it("returns true for a resolved config", () => {
    expect(isResolvedConfig(resolveConfig())).toBe(true);
  });

  it("returns false for a bare input", () => {
    expect(isResolvedConfig({ chainId: 1 })).toBe(false);
    expect(isResolvedConfig({})).toBe(false);
  });
});
