import { describe, expect, it } from "vitest";
import { getVercelCountryCode } from "./geo.js";

describe("getVercelCountryCode", () => {
  it("normalizes Vercel's two-letter ISO country code", () => {
    expect(getVercelCountryCode(" ke ", true)).toBe("KE");
  });

  it("ignores client-supplied headers outside a Vercel deployment", () => {
    expect(getVercelCountryCode("US", false)).toBeUndefined();
  });

  it("rejects missing and placeholder country codes", () => {
    expect(getVercelCountryCode(undefined, true)).toBeUndefined();
    expect(getVercelCountryCode("XX", true)).toBeUndefined();
    expect(getVercelCountryCode("ZZ", true)).toBeUndefined();
    expect(getVercelCountryCode("USA", true)).toBeUndefined();
  });
});
