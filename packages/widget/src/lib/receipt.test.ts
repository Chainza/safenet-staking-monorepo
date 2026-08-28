import { describe, expect, it, vi } from "vitest";
import type { PublicClient } from "viem";
import { waitForSuccessfulReceipt } from "./receipt.js";

const HASH = "0xabc" as `0x${string}`;

// Only the one method the helper calls is stubbed.
function clientWith(waitForTransactionReceipt: ReturnType<typeof vi.fn>): PublicClient {
  return { waitForTransactionReceipt } as unknown as PublicClient;
}

describe("waitForSuccessfulReceipt", () => {
  it("resolves when the receipt reports success", async () => {
    const wait = vi.fn().mockResolvedValue({ status: "success" });

    await expect(waitForSuccessfulReceipt(clientWith(wait), HASH)).resolves.toBeUndefined();
    expect(wait).toHaveBeenCalledWith({ hash: HASH });
  });

  it("rejects when the tx mined but reverted", async () => {
    const wait = vi.fn().mockResolvedValue({ status: "reverted" });

    await expect(waitForSuccessfulReceipt(clientWith(wait), HASH)).rejects.toThrow(
      `Transaction reverted on-chain (${HASH})`,
    );
  });

  it("propagates a failure of the wait itself", async () => {
    const wait = vi.fn().mockRejectedValue(new Error("rpc down"));

    await expect(waitForSuccessfulReceipt(clientWith(wait), HASH)).rejects.toThrow("rpc down");
  });
});
