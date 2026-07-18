import { describe, expect, it } from "vitest";

import {
  CANONICAL_HOST,
  CANONICAL_ORIGIN,
  absoluteCanonicalUrl,
  normalizeHostname,
  shouldRedirectToCanonicalHost,
} from "./site-url";

describe("site-url", () => {
  it("normalizeHostname strips port and lowercases", () => {
    expect(normalizeHostname("WWW.Plan2026.ca:443")).toBe("www.plan2026.ca");
    expect(normalizeHostname(null)).toBeNull();
  });

  it("shouldRedirectToCanonicalHost only in production for known aliases", () => {
    expect(shouldRedirectToCanonicalHost("plan2026.ca", "production")).toBe(false);
    expect(shouldRedirectToCanonicalHost("www.plan2026.ca", "production")).toBe(true);
    expect(shouldRedirectToCanonicalHost("plan2026-pi.vercel.app", "production")).toBe(true);
    expect(shouldRedirectToCanonicalHost("plan2026-pi.vercel.app", "preview")).toBe(false);
    expect(shouldRedirectToCanonicalHost("some-preview.vercel.app", "production")).toBe(false);
  });

  it("absoluteCanonicalUrl builds plan2026.ca URLs", () => {
    expect(absoluteCanonicalUrl("/")).toBe(CANONICAL_ORIGIN);
    expect(absoluteCanonicalUrl("/login")).toBe(`${CANONICAL_ORIGIN}/login`);
    expect(CANONICAL_HOST).toBe("plan2026.ca");
  });
});
