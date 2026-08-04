import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalArticle, LegalLink, LegalSection } from "./LegalArticle.js";

describe("LegalArticle", () => {
  it("renders the title, revision date and sections", () => {
    render(
      <LegalArticle title="Test Policy" updated="4 August 2026">
        <LegalSection title="A section">
          <p>Body text.</p>
        </LegalSection>
      </LegalArticle>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Test Policy" })).toBeDefined();
    expect(screen.getByText(/last updated: 4 august 2026/i)).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "A section" })).toBeDefined();
    expect(screen.getByText("Body text.")).toBeDefined();
  });

  it("resets the scroll position on mount (legal routes open from the footer)", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(
      <LegalArticle title="T" updated="today">
        <p>x</p>
      </LegalArticle>,
    );
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });
});

describe("LegalLink", () => {
  it("opens external references in a new tab", () => {
    render(<LegalLink href="https://chainza.io/">Chainza</LegalLink>);
    const link = screen.getByRole("link", { name: "Chainza" });
    expect(link.getAttribute("href")).toBe("https://chainza.io/");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });
});
