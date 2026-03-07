import { describe, expect, it } from "vitest";

import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("returns null within limit", () => {
    const result = checkRateLimit("user-a");
    expect(result).toBeNull();
  });

  it("returns retryAfterSeconds when over limit", () => {
    const id = "user-over-limit";
    // 100 requests per window; 101st should be limited
    for (let i = 0; i < 100; i++) checkRateLimit(id);
    const result = checkRateLimit(id);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("retryAfterSeconds");
    expect(typeof result!.retryAfterSeconds).toBe("number");
    expect(result!.retryAfterSeconds).toBeGreaterThan(0);
  });
});
