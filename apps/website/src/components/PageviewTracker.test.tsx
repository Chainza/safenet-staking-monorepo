import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router";
import { trackPageview } from "../lib/analytics.js";
import { PageviewTracker } from "./PageviewTracker.js";

vi.mock("../lib/analytics.js", () => ({ trackPageview: vi.fn() }));
const trackMock = vi.mocked(trackPageview);

describe("PageviewTracker", () => {
  it("tracks the initial route and every navigation", async () => {
    const user = userEvent.setup();
    const { getByRole } = render(
      <MemoryRouter initialEntries={["/"]}>
        <PageviewTracker />
        <Link to="/docs">docs</Link>
      </MemoryRouter>,
    );

    expect(trackMock).toHaveBeenCalledExactlyOnceWith("/");

    await user.click(getByRole("link", { name: "docs" }));

    expect(trackMock).toHaveBeenLastCalledWith("/docs");
    expect(trackMock).toHaveBeenCalledTimes(2);
  });
});
