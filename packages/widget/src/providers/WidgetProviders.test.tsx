import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WagmiProvider, useConfig, type Config } from "wagmi";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { WidgetProviders } from "./WidgetProviders.js";
import { useWidgetStore } from "../store.js";
import { mainnetConfig } from "../test/wagmi.js";

/** Reports the active wagmi config / query client identity and resolved mode. */
function Probe({ hostConfig, hostQc }: { hostConfig?: Config; hostQc?: QueryClient }) {
  const config = useConfig();
  const qc = useQueryClient();
  return (
    <div
      data-testid="probe"
      data-mode={useWidgetStore((s) => s.resolvedMode)}
      data-config-is-host={String(hostConfig !== undefined && config === hostConfig)}
      data-qc-is-host={String(hostQc !== undefined && qc === hostQc)}
    />
  );
}

const probe = () => screen.getByTestId("probe");

describe("WidgetProviders", () => {
  it("mounts its own wagmi + query client when the host has none (standalone)", () => {
    render(
      <WidgetProviders mode="auto">
        <Probe />
      </WidgetProviders>,
    );
    // No throw means both contexts are present; mode is standalone.
    expect(probe().getAttribute("data-mode")).toBe("standalone");
  });

  it("reuses both the host wagmi config and query client (inherit)", () => {
    const hostConfig = mainnetConfig();
    const hostQc = new QueryClient();
    render(
      <WagmiProvider config={hostConfig}>
        <QueryClientProvider client={hostQc}>
          <WidgetProviders mode="auto">
            <Probe hostConfig={hostConfig} hostQc={hostQc} />
          </WidgetProviders>
        </QueryClientProvider>
      </WagmiProvider>,
    );
    expect(probe().getAttribute("data-mode")).toBe("inherit");
    expect(probe().getAttribute("data-config-is-host")).toBe("true");
    expect(probe().getAttribute("data-qc-is-host")).toBe("true");
  });

  it("reuses a host query client but mounts its own wagmi when wagmi is absent", () => {
    const hostQc = new QueryClient();
    render(
      <QueryClientProvider client={hostQc}>
        <WidgetProviders mode="auto">
          <Probe hostQc={hostQc} />
        </WidgetProviders>
      </QueryClientProvider>,
    );
    expect(probe().getAttribute("data-mode")).toBe("standalone");
    expect(probe().getAttribute("data-qc-is-host")).toBe("true");
  });

  it('renders guidance when mode="inherit" but no host WagmiProvider exists', () => {
    render(
      <WidgetProviders mode="inherit">
        <Probe />
      </WidgetProviders>,
    );
    expect(screen.queryByTestId("probe")).toBeNull();
    expect(screen.getByText(/requires the host app to provide a WagmiProvider/i)).toBeDefined();
  });
});
