import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrivacyPage } from "./PrivacyPage.js";

describe("PrivacyPage", () => {
  it("renders the policy with the controller's identity", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeDefined();
    expect(screen.getByText(/LIMITED LIABILITY COMPANY “CHAINZA”, 21 Shvabska Street/)).toBeDefined();
  });

  it("names every service the browser talks to", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/eth.blockrazor.xyz/)).toBeDefined();
    expect(screen.getByText("Safenet indexer")).toBeDefined();
    expect(screen.getByText(/raw.githubusercontent.com/)).toBeDefined();
    expect(screen.getByText("WalletConnect relay")).toBeDefined();
    expect(screen.getByText(/Vercel/)).toBeDefined();
  });

  it("declares the indexer as Chainza-operated (first-party), not a third party", () => {
    render(<PrivacyPage />);
    expect(screen.getAllByText(/operated\s+by Chainza/).length).toBeGreaterThan(0);
  });

  it("states that no cookies or analytics are used", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/no cookies,\s*no analytics/i)).toBeDefined();
  });

  it("offers the contact email for privacy inquiries", () => {
    render(<PrivacyPage />);
    const links = screen.getAllByRole("link", { name: "connect@chainza.io" });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]!.getAttribute("href")).toBe("mailto:connect@chainza.io");
  });
});
