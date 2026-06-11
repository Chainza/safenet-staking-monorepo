import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { useValidators } from "./useValidators.js";
import { WagmiHarness, mainnetConfig } from "../test/wagmi.js";

// Stub the client seam (covered by useSafeStakeClient.test.tsx) and the
// registry fetch — what's under test is the mapping/filtering/composition.
const getTotalValidatorStakes = vi.fn();
let client: SafeStakeClient | undefined;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));

const GNOSIS = "0x3D58a5475c1336b0A755c3aBd298CeB9b7BB9CDe";
const GREENFIELD = "0x7B0A8EFA45dE81F11F2846EC28259B62155a2b37";
const RETIRED = "0xb0E735D4a3b70195420E0ae933689A55750CFcd2";

/** Registry entries as served (lowercased addresses → checksumming is on us). */
const REGISTRY_JSON = [
  { address: GNOSIS.toLowerCase(), label: "Gnosis", is_active: true },
  { address: RETIRED.toLowerCase(), label: "Retired", is_active: false },
  { address: GREENFIELD.toLowerCase(), label: "Greenfield", is_active: true },
].map((entry) => ({ ...entry, commission: 0.05, participation_rate_14d: 0.99 }));

const fetchMock = vi.fn();

const wrapper = ({ children }: { children: ReactNode }) => (
  <WagmiHarness config={mainnetConfig()}>{children}</WagmiHarness>
);

describe("useValidators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({ ok: true, json: async () => REGISTRY_JSON });
    getTotalValidatorStakes.mockImplementation(async (address: string) =>
      address === GNOSIS ? 100n : 200n,
    );
    client = { config: { chainId: 1 }, staking: { getTotalValidatorStakes } } as never;
  });

  afterEach(() => vi.unstubAllGlobals());

  it("serves active registry validators, checksummed, with live stake totals", async () => {
    const { result } = renderHook(() => useValidators(), { wrapper });

    // Inactive entries are dropped; lowercased addresses come out checksummed.
    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current.map((v) => v.name)).toEqual(["Gnosis", "Greenfield"]);
    expect(result.current.map((v) => v.address)).toEqual([GNOSIS, GREENFIELD]);

    // Stake totals resolve per validator via the client.
    await waitFor(() => expect(result.current[0]!.totalStaked).toBe(100n));
    expect(result.current[1]!.totalStaked).toBe(200n);
    expect(getTotalValidatorStakes).toHaveBeenCalledWith(GNOSIS);
    expect(getTotalValidatorStakes).toHaveBeenCalledWith(GREENFIELD);
  });

  it("lists validators with zero stake on chains without a client", async () => {
    client = undefined;
    const { result } = renderHook(() => useValidators(), { wrapper });

    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current.every((v) => v.totalStaked === 0n)).toBe(true);
    expect(getTotalValidatorStakes).not.toHaveBeenCalled();
  });

  it("returns an empty set while the registry fetch fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    const { result } = renderHook(() => useValidators(), { wrapper });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current).toEqual([]);
    expect(getTotalValidatorStakes).not.toHaveBeenCalled();
  });
});
