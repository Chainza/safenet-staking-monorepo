import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WalletControl } from "./WalletControl.js";
import { useWidgetStore, type ResolvedMode } from "../store.js";
import {
  WagmiHarness,
  injectedPickerConfig,
  mainnetConfig,
  twoConnectorConfig,
} from "../test/wagmi.js";
import type { Config } from "wagmi";

function renderControl(config: Config, mode: ResolvedMode = "standalone") {
  useWidgetStore.setState({ resolvedMode: mode });
  return render(
    <WagmiHarness config={config}>
      <WalletControl />
    </WagmiHarness>,
  );
}

describe("WalletControl", () => {
  it("renders nothing in inherit mode (host owns connection)", () => {
    renderControl(mainnetConfig(), "inherit");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("connects directly with a single connector, then disconnects", async () => {
    const user = userEvent.setup();
    renderControl(mainnetConfig());

    await user.click(screen.getByRole("button", { name: /connect wallet/i }));
    const pill = await screen.findByRole("button", { name: /0x7099/i });
    expect(pill).toBeDefined();
    expect(screen.queryByRole("button", { name: /connect wallet/i })).toBeNull();

    await user.click(pill);
    await user.click(screen.getByRole("button", { name: /disconnect/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /connect wallet/i })).toBeDefined(),
    );
  });

  it("shows a connector picker when multiple connectors are available", async () => {
    const user = userEvent.setup();
    renderControl(twoConnectorConfig());

    await user.click(screen.getByRole("button", { name: /connect wallet/i }));
    const options = screen.getAllByRole("button", { name: /mock connector/i });
    expect(options.length).toBe(2);

    await user.click(options[0]!);
    expect(await screen.findByRole("button", { name: /0x7099/i })).toBeDefined();
  });

  it('labels the injected connector as "Browser Wallet"', async () => {
    const user = userEvent.setup();
    renderControl(injectedPickerConfig());

    await user.click(screen.getByRole("button", { name: /connect wallet/i }));
    expect(screen.getByRole("button", { name: /browser wallet/i })).toBeDefined();
    expect(screen.queryByRole("button", { name: /^injected$/i })).toBeNull();
  });
});
