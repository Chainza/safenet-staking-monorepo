import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RisksDisclosure } from "./RisksDisclosure.js";

const SEVEN_DAYS = 604_800n;

describe("RisksDisclosure", () => {
  it("renders collapsed: only the trigger, no risk details", () => {
    render(<RisksDisclosure withdrawDelaySec={SEVEN_DAYS} />);
    const trigger = screen.getByRole("button", { name: /staking involves risk/i });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText(/slashing/i)).toBeNull();
  });

  it("expands to the four documented risks with the live withdrawal delay", async () => {
    const user = userEvent.setup();
    render(<RisksDisclosure withdrawDelaySec={SEVEN_DAYS} />);
    await user.click(screen.getByRole("button", { name: /staking involves risk/i }));

    expect(screen.getByText("Unbonding delay")).toBeDefined();
    expect(screen.getByText("Slashing")).toBeDefined();
    expect(screen.getByText("Validator performance")).toBeDefined();
    expect(screen.getByText("Smart-contract risk")).toBeDefined();

    // The delay is the live on-chain value, not a hardcoded figure.
    expect(screen.getByText(/7-day withdrawal delay/)).toBeDefined();
    // Key docs facts survive the summarisation.
    expect(screen.getByText(/No slashing in Safenet Beta/)).toBeDefined();
    expect(screen.getByText(/below 75%/)).toBeDefined();
  });

  it("links to the official risk disclosure in a new tab", async () => {
    const user = userEvent.setup();
    render(<RisksDisclosure withdrawDelaySec={SEVEN_DAYS} />);
    await user.click(screen.getByRole("button", { name: /staking involves risk/i }));

    const link = screen.getByRole("link", { name: /learn more/i });
    expect(link.getAttribute("href")).toBe("https://docs.safefoundation.org/safenet/staking/risk");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });

  it("collapses back on a second click", async () => {
    const user = userEvent.setup();
    render(<RisksDisclosure withdrawDelaySec={SEVEN_DAYS} />);
    const trigger = screen.getByRole("button", { name: /staking involves risk/i });

    await user.click(trigger);
    expect(screen.getByText("Slashing")).toBeDefined();
    await user.click(trigger);
    expect(screen.queryByText("Slashing")).toBeNull();
  });
});
