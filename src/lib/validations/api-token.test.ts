import { describe, expect, it } from "vitest";

import {
  API_TOKEN_NAME_MAX_LENGTH,
  apiTokenIdSchema,
  createApiTokenSchema,
} from "./api-token";

describe("api-token validations", () => {
  it("accepts a trimmed token name", () => {
    const parsed = createApiTokenSchema.safeParse({ name: "  CLI laptop  " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.name).toBe("CLI laptop");
  });

  it("rejects empty and oversized names", () => {
    expect(createApiTokenSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(
      createApiTokenSchema.safeParse({ name: "x".repeat(API_TOKEN_NAME_MAX_LENGTH + 1) }).success,
    ).toBe(false);
  });

  it("validates token ids as CUIDs", () => {
    expect(apiTokenIdSchema.safeParse({ tokenId: "c".padEnd(25, "a") }).success).toBe(true);
    expect(apiTokenIdSchema.safeParse({ tokenId: "not-a-cuid" }).success).toBe(false);
    expect(apiTokenIdSchema.safeParse({ tokenId: "" }).success).toBe(false);
  });
});
