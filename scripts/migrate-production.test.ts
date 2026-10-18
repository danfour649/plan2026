import { describe, expect, it } from "vitest";
import { shouldApplyProductionMigrations } from "./migrate-production.mjs";

describe("shouldApplyProductionMigrations", () => {
  it("applies migrations only for a Vercel production build", () => {
    expect(shouldApplyProductionMigrations({ VERCEL_ENV: "production" })).toBe(true);
  });

  it("skips preview builds, which share the production DATABASE_URL", () => {
    expect(shouldApplyProductionMigrations({ VERCEL_ENV: "preview" })).toBe(false);
  });

  it("skips local builds and GitHub Actions, which do not set VERCEL_ENV", () => {
    expect(shouldApplyProductionMigrations({})).toBe(false);
    expect(shouldApplyProductionMigrations({ VERCEL_ENV: "" })).toBe(false);
    expect(shouldApplyProductionMigrations({ VERCEL: "1" })).toBe(false);
  });
});
