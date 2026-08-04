import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { TermsPage } from "./TermsPage.js";

const renderPage = () =>
  render(
    <MemoryRouter>
      <TermsPage />
    </MemoryRouter>,
  );

describe("TermsPage", () => {
  it("renders the terms with the load-bearing sections", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeDefined();
    expect(screen.getByRole("heading", { name: /eligibility and sanctions/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /risks/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /limitation of liability/i })).toBeDefined();
  });

  it("names Ukraine as the governing law", () => {
    renderPage();
    expect(screen.getByText(/governed by the laws of Ukraine/)).toBeDefined();
  });

  it("links to the official risk disclosure and the imprint", () => {
    renderPage();

    expect(screen.getByRole("link", { name: /is my stake at risk/i }).getAttribute("href")).toBe(
      "https://docs.safefoundation.org/safenet/staking/risk",
    );
    expect(screen.getByRole("link", { name: "Imprint" }).getAttribute("href")).toBe("/imprint");
  });

  it("contains no email address", () => {
    const { container } = renderPage();
    expect(container.textContent).not.toMatch(/\S+@\S+/);
  });
});
