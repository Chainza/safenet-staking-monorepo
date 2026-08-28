import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { FaqPage } from "./FaqPage.js";

const renderPage = () =>
  render(
    <MemoryRouter>
      <FaqPage />
    </MemoryRouter>,
  );

describe("FaqPage", () => {
  it("renders the FAQ with one section heading per question", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Frequently Asked Questions" }),
    ).toBeDefined();
    for (const question of [
      "What is Safenet staking?",
      "Is this interface custodial?",
      "How do I stake?",
      "How do I unstake, and when do I get my tokens back?",
      "How do rewards work?",
      "What are the risks?",
      "What does it cost?",
      "Which wallets can I use?",
      "Why is my wallet blocked?",
      "Can I verify or self-host the interface?",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: question })).toBeDefined();
    }
  });

  it("states the key protocol facts (non-custodial, no Beta slashing, 75% rule)", () => {
    renderPage();

    expect(screen.getByText(/never holds your tokens/i)).toBeDefined();
    expect(screen.getByText(/no slashing in Safenet Beta/i)).toBeDefined();
    expect(screen.getByText(/below 75% in a reward period/i)).toBeDefined();
  });

  it("links to the official risk docs externally and the in-app pages internally", () => {
    renderPage();

    const risks = screen.getByRole("link", { name: /safenet staking risk documentation/i });
    expect(risks.getAttribute("href")).toBe("https://docs.safefoundation.org/safenet/staking/risk");
    expect(risks.getAttribute("target")).toBe("_blank");

    const developers = screen.getByRole("link", { name: "Developers" });
    expect(developers.getAttribute("href")).toBe("/docs");
    expect(developers.getAttribute("target")).toBeNull();

    const imprint = screen.getByRole("link", { name: "Imprint" });
    expect(imprint.getAttribute("href")).toBe("/imprint");
  });
});
