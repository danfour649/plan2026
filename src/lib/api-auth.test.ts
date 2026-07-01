import { describe, expect, it } from "vitest";

import { API_TOKEN_PREFIX, extractBearerToken, hashApiToken, safeEqualStrings } from "./api-auth-utils";

describe("api-auth-utils", () => {
  it("extractBearerToken parses Authorization header", () => {
    expect(extractBearerToken("Bearer abc")).toBe("abc");
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it("hashApiToken is stable", () => {
    const token = `${API_TOKEN_PREFIX}test`;
    expect(hashApiToken(token)).toHaveLength(64);
    expect(hashApiToken(token)).toBe(hashApiToken(token));
  });

  it("safeEqualStrings compares in constant time", () => {
    expect(safeEqualStrings("a", "a")).toBe(true);
    expect(safeEqualStrings("a", "b")).toBe(false);
    expect(safeEqualStrings("a", "aa")).toBe(false);
  });
});
