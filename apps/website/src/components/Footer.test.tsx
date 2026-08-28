import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Footer } from "./Footer.js";

const externalLinks = [
  { name: /safenetstake\.eth/i, href: "https://safenetstake.eth.limo/" },
  { name: /safenet explorer/i, href: "https://explorer.safenet-beta.eth.limo/" },
  { name: /safenet faq/i, href: "https://docs.safefoundation.org/safenet/resources/faq" },
  { name: /^docs$/i, href: "https://docs.safefoundation.org/safenet/overview/introduction" },
  { name: /staking risks/i, href: "https://docs.safefoundation.org/safenet/staking/risk" },
];

const internalLinks = [
  { name: /developers/i, href: "/docs" },
  { name: /^faq$/i, href: "/faq" },
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

  it.each(internalLinks)("routes to the internal page $href", ({ name, href }) => {
    renderFooter();

    const link = screen.getByRole("link", { name });
    expect(link.getAttribute("href")).toBe(href);
    // Internal routes stay in-app: no new tab.
    expect(link.getAttribute("target")).toBeNull();
  });

  it("renders exactly the ten links", () => {
    renderFooter();

    expect(screen.getAllByRole("link")).toHaveLength(10);
  });

  it("marks only the currently open internal page's link as current", () => {
    render(
      <MemoryRouter initialEntries={["/terms"]}>
        <Footer />
      </MemoryRouter>,
    );

    const terms = screen.getByRole("link", { name: /terms/i });
    expect(terms.getAttribute("aria-current")).toBe("page");
    // The active link reads stronger than the muted default.
    expect(terms.className).toContain("text-[var(--page-fg)]");
    expect(terms.className).not.toContain("text-[var(--page-muted)]");

    const imprint = screen.getByRole("link", { name: /imprint/i });
    expect(imprint.getAttribute("aria-current")).toBeNull();
    expect(imprint.className).toContain("text-[var(--page-muted)]");
  });
});
