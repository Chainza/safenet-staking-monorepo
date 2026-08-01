import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer.js";

const expectedLinks = [
  { name: /safenet explorer/i, href: "https://explorer.safenet-beta.eth.limo/" },
  { name: /faq/i, href: "https://docs.safefoundation.org/safenet/resources/faq" },
  { name: /docs/i, href: "https://docs.safefoundation.org/safenet/overview/introduction" },
];

describe("Footer", () => {
  it.each(expectedLinks)("links to $href in a new tab", ({ name, href }) => {
    render(<Footer />);

    const link = screen.getByRole("link", { name });
    expect(link.getAttribute("href")).toBe(href);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });

  it("renders exactly the three resource links", () => {
    render(<Footer />);

    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});
