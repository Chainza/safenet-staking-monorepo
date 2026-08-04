import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStandaloneConfig } from "./standaloneConfig.js";
import { isIframe } from "../lib/isIframe.js";

vi.mock("../lib/isIframe.js", () => ({ isIframe: vi.fn(() => false) }));
vi.mock("../lib/logger.js", () => ({
  logger: { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const isIframeMock = vi.mocked(isIframe);

function connectorIds(config: ReturnType<typeof getStandaloneConfig>) {
  return config.connectors.map((c) => c.id);
}

describe("getStandaloneConfig", () => {
  beforeEach(() => {
    isIframeMock.mockReturnValue(false);
  });

  it("offers only the injected connector without a projectId, outside an iframe", () => {
    expect(connectorIds(getStandaloneConfig())).toEqual(["injected"]);
  });

  it("adds WalletConnect when a projectId is supplied", () => {
    expect(connectorIds(getStandaloneConfig("wc-project"))).toEqual(["injected", "walletConnect"]);
  });

  it("adds the Safe connector when embedded in an iframe", () => {
    isIframeMock.mockReturnValue(true);
    expect(connectorIds(getStandaloneConfig("wc-project-framed"))).toEqual([
      "injected",
      "walletConnect",
      "safe",
    ]);
  });

  it("caches the config per projectId", () => {
    expect(getStandaloneConfig("wc-project")).toBe(getStandaloneConfig("wc-project"));
  });
});
