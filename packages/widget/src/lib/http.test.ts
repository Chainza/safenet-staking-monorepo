import { describe, expect, it } from "vitest";
import axios from "axios";
import { http } from "./http.js";

describe("http", () => {
  it("is an isolated axios instance, so host-app defaults can't leak in", () => {
    expect(http).not.toBe(axios);
    expect(http.interceptors).not.toBe(axios.interceptors);
  });

  it("fails fast instead of hanging a panel", () => {
    expect(http.defaults.timeout).toBe(10_000);
  });
});
