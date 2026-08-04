import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Footer } from "./Footer.js";

const externalLinks = [
  { name: /safenet explorer/i, href: "https://explorer.safenet-beta.eth.limo/" },
  { name: /faq/i, href: "https://docs.safefoundation.org/safenet/resources/faq" },
  { name: /^docs$/i, href: "https://docs.safefoundation.org/safenet/overview/introduction" },
  { name: /staking risks/i, href: "https://docs.safefoundation.org/safenet/staking/risk" },
];

const legalLinks = [
  { name: /imprint/i, href: "/imprint" },
  { name: /terms/i, href: "/terms" },
  { name: /privacy/i, href: "/privacy" },
];

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

describe("Footer", () => {
  it.each(externalLinks)("links to $href in a new tab", ({ name, href }) => {
    renderFooter();

    const link = screen.getByRole("link", { name });
    expect(link.getAttribute("href")).toBe(href);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });

  it.each(legalLinks)("routes to the internal legal page $href", ({ name, href }) => {
    renderFooter();

    const link = screen.getByRole("link", { name });
    expect(link.getAttribute("href")).toBe(href);
    // Internal routes stay in-app: no new tab.
    expect(link.getAttribute("target")).toBeNull();
  });

  it("renders exactly the seven links", () => {
    renderFooter();

    expect(screen.getAllByRole("link")).toHaveLength(7);
  });
});
