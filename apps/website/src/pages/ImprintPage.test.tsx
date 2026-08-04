import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImprintPage } from "./ImprintPage.js";

describe("ImprintPage", () => {
  it("discloses the operator's identity", () => {
    render(<ImprintPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Imprint" })).toBeDefined();
    expect(screen.getByText(/LIMITED LIABILITY COMPANY “CHAINZA”/)).toBeDefined();
    expect(screen.getByText(/21 Shvabska Street, office 1/)).toBeDefined();
    expect(screen.getByText(/Uzhhorod, 88018/)).toBeDefined();
    expect(screen.getByText(/Vladyslav Myronenko/)).toBeDefined();
  });

  it("links to the operator's website and the open-source repository", () => {
    render(<ImprintPage />);

    expect(screen.getByRole("link", { name: "https://chainza.io/" }).getAttribute("href")).toBe(
      "https://chainza.io/",
    );
    expect(
      screen
        .getByRole("link", { name: /github.com\/Chainza\/safenet-staking-monorepo/ })
        .getAttribute("href"),
    ).toBe("https://github.com/Chainza/safenet-staking-monorepo");
  });

  it("offers the contact email as a mailto link (no new tab)", () => {
    render(<ImprintPage />);
    const [mail] = screen.getAllByRole("link", { name: "connect@chainza.io" });
    expect(mail!.getAttribute("href")).toBe("mailto:connect@chainza.io");
    expect(mail!.getAttribute("target")).toBeNull();
  });
});
