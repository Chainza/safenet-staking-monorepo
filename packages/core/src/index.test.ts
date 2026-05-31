import { describe, expect, it } from "vitest";
import { VERSION, type StakingConfig } from "./index.js";

describe("safe-stake-core", () => {
  it("exposes a version", () => {
    expect(VERSION).toBe("0.0.0");
  });

  it("accepts a staking config shape", () => {
    const config: StakingConfig = {
      chainId: 1,
      stakingContract: "0x0000000000000000000000000000000000000000",
    };
    expect(config.chainId).toBe(1);
  });
});
