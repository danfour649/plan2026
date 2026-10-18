import { describe, expect, it } from "vitest";
import {
  runProductionMigrations,
  shouldApplyProductionMigrations,
} from "./migrate-production.mjs";

const SECRET_URL =
  "postgresql://plan2026:super-secret-db-password@db.internal:5432/plan2026";

type SpawnResult = { status: number | null; error?: Error };

function runWith(
  env: Record<string, string | undefined>,
  spawnResult: SpawnResult = { status: 0 },
) {
  const calls: Array<{ command: string; args: string[]; env?: NodeJS.ProcessEnv }> = [];
  const logs: string[] = [];
  const errors: string[] = [];
  const exits: number[] = [];

  runProductionMigrations({
    env: { NODE_ENV: "test", ...env },
    spawn: ((command: string, args: string[], options: { env?: NodeJS.ProcessEnv }) => {
      calls.push({ command, args, env: options.env });
      return spawnResult;
    }) as never,
    log: (message) => logs.push(message),
    error: (message) => errors.push(message),
    exit: (code) => {
      exits.push(code);
    },
  });

  return { calls, logs, errors, exits };
}

function outputOf(logs: string[], errors: string[]) {
  return [...logs, ...errors].join("\n");
}

describe("runProductionMigrations", () => {
  it("runs prisma migrate deploy only when VERCEL_ENV is production", () => {
    const { calls, logs, exits } = runWith({
      VERCEL_ENV: "production",
      DATABASE_URL: SECRET_URL,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.command).toBe(process.platform === "win32" ? "pnpm.cmd" : "pnpm");
    expect(calls[0]?.args).toEqual(["exec", "prisma", "migrate", "deploy"]);
    expect(calls[0]?.env?.DATABASE_URL).toBe(SECRET_URL);
    expect(logs).toContain("Applying pending Prisma migrations (VERCEL_ENV=production).");
    expect(exits).toEqual([]);
  });

  it.each(["preview", "development", undefined] as const)(
    "skips when VERCEL_ENV is %s",
    (vercelEnv) => {
      const env: Record<string, string | undefined> = { DATABASE_URL: SECRET_URL };
      if (vercelEnv) env.VERCEL_ENV = vercelEnv;
      const { calls, logs } = runWith(env);

      expect(calls).toEqual([]);
      expect(logs[0]).toContain("Skipping prisma migrate deploy");
      expect(shouldApplyProductionMigrations(env)).toBe(false);
    },
  );

  it("skips GitHub Actions even if VERCEL_ENV is production", () => {
    const { calls } = runWith({
      GITHUB_ACTIONS: "true",
      CI: "true",
      VERCEL_ENV: "production",
      DATABASE_URL: SECRET_URL,
    });
    expect(calls).toEqual([]);
  });

  it("skips other CI hosts that are not Vercel", () => {
    const { calls } = runWith({
      CI: "true",
      VERCEL_ENV: "production",
      DATABASE_URL: SECRET_URL,
    });
    expect(calls).toEqual([]);
  });

  it("still migrates a Vercel production build, which sets CI=1", () => {
    const { calls } = runWith({
      CI: "1",
      VERCEL: "1",
      VERCEL_ENV: "production",
      DATABASE_URL: SECRET_URL,
    });
    expect(calls).toHaveLength(1);
  });

  it("fails the build when prisma migrate deploy exits non-zero", () => {
    const { exits, calls } = runWith(
      { VERCEL_ENV: "production", DATABASE_URL: SECRET_URL },
      { status: 2 },
    );
    expect(calls).toHaveLength(1);
    expect(exits).toEqual([2]);
  });

  it("fails the build when prisma cannot be started", () => {
    const { exits } = runWith(
      { VERCEL_ENV: "production", DATABASE_URL: SECRET_URL },
      { status: null, error: new Error(`connect ${SECRET_URL}`) },
    );
    expect(exits).toEqual([1]);
  });

  it("never logs DATABASE_URL", () => {
    const applied = runWith({
      VERCEL_ENV: "production",
      DATABASE_URL: SECRET_URL,
    });
    const failed = runWith(
      { VERCEL_ENV: "production", DATABASE_URL: SECRET_URL },
      { status: null, error: new Error(`connect ${SECRET_URL}`) },
    );
    const skipped = runWith({
      VERCEL_ENV: "preview",
      DATABASE_URL: SECRET_URL,
    });

    for (const result of [applied, failed, skipped]) {
      const text = outputOf(result.logs, result.errors);
      expect(text).not.toContain(SECRET_URL);
      expect(text).not.toContain("super-secret-db-password");
      expect(text).not.toContain("db.internal");
    }
  });
});
