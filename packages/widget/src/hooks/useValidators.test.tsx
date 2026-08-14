import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SafeStakeClient } from "safe-stake-core";
import { http } from "../lib/http.js";
import { useValidators } from "./useValidators.js";
import { WagmiHarness, mainnetConfig } from "../test/wagmi.js";

// Stub the client seam (covered by useSafeStakeClient.test.tsx), the
// sanctions gate (useIsSanctioned.test.tsx) and the registry fetch — what's
// under test is the mapping/filtering/composition.
const getTotalValidatorStakes = vi.fn();
let client: SafeStakeClient | undefined;
vi.mock("./useSafeStakeClient.js", () => ({ useSafeStakeClient: () => client }));
let cleared = true;
vi.mock("./useIsSanctioned.js", () => ({ useSanctionsCleared: () => cleared }));

const GNOSIS = "0x3D58a5475c1336b0A755c3aBd298CeB9b7BB9CDe";
const GREENFIELD = "0x7B0A8EFA45dE81F11F2846EC28259B62155a2b37";
const RETIRED = "0xb0E735D4a3b70195420E0ae933689A55750CFcd2";

/** Registry entries as served (lowercased addresses → checksumming is on us). */
const REGISTRY_JSON = [
  { address: GNOSIS.toLowerCase(), label: "Gnosis", is_active: true },
  { address: RETIRED.toLowerCase(), label: "Retired", is_active: false },
  { address: GREENFIELD.toLowerCase(), label: "Greenfield", is_active: true },
].map((entry) => ({ ...entry, commission: 0.05, participation_rate_14d: 0.99 }));

// The widget's axios instance is the single HTTP seam (lib/http.test.ts covers
// the instance itself), so stub it rather than the network.
vi.mock("../lib/http.js", () => ({ http: { get: vi.fn() } }));
const getMock = vi.mocked(http.get);

const wrapper = ({ children }: { children: ReactNode }) => (
  <WagmiHarness config={mainnetConfig()}>{children}</WagmiHarness>
);

describe("useValidators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockResolvedValue({ data: REGISTRY_JSON });
    getTotalValidatorStakes.mockImplementation(async (address: string) =>
      address === GNOSIS ? 100n : 200n,
    );
    client = { config: { chainId: 1 }, staking: { getTotalValidatorStakes } } as never;
    cleared = true;
  });

  it("serves active registry validators, checksummed, with live stake totals", async () => {
    const { result } = renderHook(() => useValidators(), { wrapper });

    // Inactive entries are dropped; lowercased addresses come out checksummed.
    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current.map((v) => v.name)).toEqual(["Gnosis", "Greenfield"]);
    expect(result.current.map((v) => v.address)).toEqual([GNOSIS, GREENFIELD]);

    // Registry stats come through under their camelCased names.
    expect(result.current[0]!.commission).toBe(0.05);
    expect(result.current[0]!.participationRate14d).toBe(0.99);

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

  it("makes no registry fetch until the sanctions screen clears the wallet", () => {
    // The stake query is covered too: the screened seam yields no client
    // until then.
    cleared = false;
    client = undefined;
    const { result } = renderHook(() => useValidators(), { wrapper });
    expect(result.current).toEqual([]);
    expect(getMock).not.toHaveBeenCalled();
    expect(getTotalValidatorStakes).not.toHaveBeenCalled();
  });

  it("returns an empty set while the registry fetch fails", async () => {
    // axios rejects on non-2xx; the query error leaves the set empty.
    getMock.mockRejectedValue(new Error("Request failed with status code 503"));
    const { result } = renderHook(() => useValidators(), { wrapper });

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(result.current).toEqual([]);
    expect(getTotalValidatorStakes).not.toHaveBeenCalled();
  });
});
