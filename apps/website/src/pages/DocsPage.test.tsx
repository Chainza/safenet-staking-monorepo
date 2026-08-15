import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocsPage } from "./DocsPage.js";

describe("DocsPage", () => {
  it("renders as developer documentation, not a legal page", () => {
    render(<DocsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Developer documentation" }),
    ).toBeDefined();
    expect(screen.getByText("SAFENET · DOCS")).toBeDefined();
  });

  it("documents the integration path: install, embed, configure", () => {
    render(<DocsPage />);

    expect(screen.getByText(/pnpm add @chainza\/safenet-staking-widget/)).toBeDefined();
    expect(screen.getByText(/<Widget walletConnectProjectId=/)).toBeDefined();
    expect(screen.getByText(/createSafeStakeClient\(\{ publicClient \}\)/)).toBeDefined();
  });

  it("lists every widget prop with its default", () => {
    render(<DocsPage />);

    for (const [prop, fallback] of [
      ["mode", '"auto"'],
      ["theme", '"dark"'],
      ["walletConnectProjectId", "—"],
    ]) {
      const row = screen.getByRole("cell", { name: prop }).closest("tr");
      expect(row).not.toBeNull();
      expect(row!.textContent).toContain(fallback);
    }
  });

  it("links to both packages on npm and to the source repository", () => {
    render(<DocsPage />);

    const href = (name: RegExp) => screen.getByRole("link", { name }).getAttribute("href");
    expect(href(/^@chainza\/safenet-staking-core$/)).toBe(
      "https://www.npmjs.com/package/@chainza/safenet-staking-core",
    );
    expect(href(/^@chainza\/safenet-staking-widget$/)).toBe(
      "https://www.npmjs.com/package/@chainza/safenet-staking-widget",
    );
    expect(href(/one public repository/)).toBe(
      "https://github.com/Chainza/safenet-staking-monorepo",
    );
  });

  it("points at the verification and risk material a self-hoster needs", () => {
    render(<DocsPage />);

    expect(screen.getByRole("link", { name: /hosting documentation/ }).getAttribute("href")).toBe(
      "https://github.com/Chainza/safenet-staking-monorepo/blob/main/HOSTING.md",
    );
    expect(screen.getByRole("link", { name: /releases page/ }).getAttribute("href")).toBe(
      "https://github.com/Chainza/safenet-staking-monorepo/releases",
    );
    expect(
      screen.getByRole("link", { name: /staking risk documentation/ }).getAttribute("href"),
    ).toBe("https://docs.safefoundation.org/safenet/staking/risk");
  });

  it("opens every outbound link in a new tab", () => {
    render(<DocsPage />);

    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noreferrer");
    }
  });
});
