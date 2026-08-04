import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SanctionedNotice } from "./SanctionedNotice.js";

describe("SanctionedNotice", () => {
  it("renders a blocking alert explaining the sanctions flag", () => {
    render(<SanctionedNotice />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Address blocked");
    expect(alert.textContent).toContain("sanctioned");
  });
});
