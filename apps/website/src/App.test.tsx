import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App.js";
import { WagmiHarness, mainnetConfig } from "./test/wagmi.js";

// Stub the widget: it's the widget package's concern (and its live on-chain
// reads have no place here) — under test is the app shell around it.
vi.mock("safe-stake-widget", () => ({
  Widget: ({ theme }: { theme: string }) => <div data-testid="widget" data-theme={theme} />,
}));

// Stub the history query so connected renders of the Activity page don't hit
// the Indexer API; the hook and table have their own tests.
vi.mock("./hooks/useStakerTransactions.js", () => ({
  useStakerTransactions: () => ({ data: undefined, isPending: true, isError: false }),
}));

function renderApp({ connected = false, initialPath = "/" } = {}) {
  return render(
    <WagmiHarness config={mainnetConfig(connected)}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </WagmiHarness>,
  );
}

beforeEach(() => {
  localStorage.clear();
  // jsdom has no matchMedia (getInitialTheme's OS-preference probe).
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
});

describe("App", () => {
  it("renders the Stake page with the widget at /", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: /stake safe/i })).toBeDefined();
    expect(screen.getByTestId("widget")).toBeDefined();
  });

  it("renders the header without the nav while disconnected", () => {
    renderApp();

    expect(screen.queryByRole("navigation", { name: "Primary" })).toBeNull();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeDefined();
    expect(screen.getByRole("img", { name: "Safe" })).toBeDefined();
  });

  it("shows the nav once connected", async () => {
    renderApp({ connected: true });

    expect(await screen.findByRole("navigation", { name: "Primary" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Stake" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Activity" })).toBeDefined();
  });

  it("navigates to the Activity page and back", async () => {
    const user = userEvent.setup();
    renderApp({ connected: true });

    await user.click(await screen.findByRole("link", { name: "Activity" }));
    expect(screen.getByRole("heading", { name: /staking activity/i })).toBeDefined();
    expect(screen.queryByTestId("widget")).toBeNull();

    await user.click(screen.getByRole("link", { name: "Stake" }));
    expect(screen.getByTestId("widget")).toBeDefined();
  });

  it("renders the Activity page on a direct /activity visit while connected", async () => {
    renderApp({ connected: true, initialPath: "/activity" });

    expect(await screen.findByRole("heading", { name: /staking activity/i })).toBeDefined();
  });

  it("redirects /activity to the Stake page while disconnected", async () => {
    renderApp({ initialPath: "/activity" });

    expect(await screen.findByTestId("widget")).toBeDefined();
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /staking activity/i })).toBeNull(),
    );
  });

  it("marks only the current route's nav link active", async () => {
    renderApp({ connected: true, initialPath: "/activity" });

    const activityLink = await screen.findByRole("link", { name: "Activity" });
    expect(activityLink.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Stake" }).getAttribute("aria-current")).toBeNull();
  });

  it("toggles the theme and threads it to the widget", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByTestId("widget").getAttribute("data-theme")).toBe("light");

    await user.click(screen.getByRole("button", { name: /switch to dark theme/i }));

    expect(screen.getByTestId("widget").getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
