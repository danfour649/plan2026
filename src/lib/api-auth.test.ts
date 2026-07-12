import { describe, expect, it } from "vitest";

import {
  API_TOKEN_DISPLAY_PREFIX_LENGTH,
  API_TOKEN_PREFIX,
  extractBearerToken,
  generateApiToken,
  hashApiToken,
  safeEqualStrings,
} from "./api-auth-utils";

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

  it("generateApiToken produces a prefixed token with matching hash and display prefix", () => {
    const { rawToken, tokenHash, tokenPrefix } = generateApiToken();
    expect(rawToken.startsWith(API_TOKEN_PREFIX)).toBe(true);
    expect(tokenHash).toBe(hashApiToken(rawToken));
    expect(tokenPrefix).toBe(rawToken.slice(0, API_TOKEN_DISPLAY_PREFIX_LENGTH));
    expect(generateApiToken().rawToken).not.toBe(rawToken);
  });

  it("safeEqualStrings compares in constant time", () => {
    expect(safeEqualStrings("a", "a")).toBe(true);
    expect(safeEqualStrings("a", "b")).toBe(false);
    expect(safeEqualStrings("a", "aa")).toBe(false);
  });
});
