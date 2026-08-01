import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer.js";

describe("Footer", () => {
  it("links to the Safenet Explorer in a new tab", () => {
    render(<Footer />);

    const link = screen.getByRole("link", { name: /safenet explorer/i });
    expect(link.getAttribute("href")).toBe("https://explorer.safenet-beta.eth.limo/");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });
});
