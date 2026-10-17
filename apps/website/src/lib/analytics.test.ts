import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { INDEXER_API_URL } from "./indexer.js";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
const postMock = vi.mocked(axios.post);

const URL = `${INDEXER_API_URL}/pageviews`;

// The module keeps a "referrer already sent" flag, so each test loads a fresh copy.
async function loadTrackPageview() {
  vi.resetModules();
  return (await import("./analytics.js")).trackPageview;
}

beforeEach(() => {
  postMock.mockReset().mockResolvedValue({});
  vi.stubEnv("PROD", true);
  vi.spyOn(document, "referrer", "get").mockReturnValue("https://x.com/post");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("trackPageview", () => {
  it("posts hostname, path and referrer to the indexer", async () => {
    const trackPageview = await loadTrackPageview();
    trackPageview("/docs");

    expect(postMock).toHaveBeenCalledWith(URL, {
      hostname: window.location.hostname,
      path: "/docs",
      referrer: "https://x.com/post",
    });
  });

  it("sends the referrer with the first pageview only", async () => {
    const trackPageview = await loadTrackPageview();
    trackPageview("/");
    trackPageview("/faq");

    expect(postMock).toHaveBeenNthCalledWith(
      2,
      URL,
      expect.objectContaining({ path: "/faq", referrer: "" }),
    );
  });

  it("does nothing outside production builds", async () => {
    vi.stubEnv("PROD", false);
    const trackPageview = await loadTrackPageview();
    trackPageview("/");

    expect(postMock).not.toHaveBeenCalled();
  });

  it("swallows a failed request", async () => {
    postMock.mockRejectedValue(new Error("indexer down"));
    const trackPageview = await loadTrackPageview();

    expect(() => trackPageview("/")).not.toThrow();
    // Let the rejection settle: an unhandled one would fail the run.
    await Promise.resolve();
  });
});
