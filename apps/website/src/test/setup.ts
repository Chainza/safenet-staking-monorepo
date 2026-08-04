import { vi } from "vitest";

// jsdom doesn't implement window.scrollTo and logs a noisy "Not implemented"
// error each time it's called (LegalArticle resets scroll on mount). Stub it
// globally; tests that care assert on the spy's calls.
vi.stubGlobal("scrollTo", vi.fn());
