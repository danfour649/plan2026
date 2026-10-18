#!/usr/bin/env node
/**
 * Apply pending Prisma migrations only on a Vercel production build.
 *
 * The plan2026 Vercel project stores one DATABASE_URL for Production, Preview,
 * and Development. A preview build of an unmerged migration must not change
 * that database. GitHub Actions and any other CI host that is not Vercel must
 * not connect either. Vercel production builds set CI=1 and VERCEL=1 together;
 * that CI flag does not skip the migrate step.
 *
 * Invoked from the `build` script, which is what the Vercel production
 * deployment runs (`pnpm run build`).
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {boolean}
 */
export function shouldApplyProductionMigrations(env = process.env) {
  if (env.GITHUB_ACTIONS === "true") return false;
  if (env.VERCEL_ENV !== "production") return false;
  const onCi = env.CI === "true" || env.CI === "1";
  if (onCi && env.VERCEL !== "1") return false;
  return true;
}

/**
 * @param {string} entry
 * @param {string} [moduleUrl]
 */
export function isDirectExecution(entry, moduleUrl = import.meta.url) {
  if (!entry) return false;
  return moduleUrl === pathToFileURL(entry).href;
}

/**
 * @param {{
 *   env?: Record<string, string | undefined>,
 *   spawn?: typeof spawnSync,
 *   log?: (message: string) => void,
 *   error?: (message: string) => void,
 *   exit?: (code: number) => void,
 * }} [options]
 */
export function runProductionMigrations({
  env = process.env,
  spawn = spawnSync,
  log = console.log,
  error = console.error,
  exit = process.exit,
} = {}) {
  if (!shouldApplyProductionMigrations(env)) {
    log(
      `Skipping prisma migrate deploy (VERCEL_ENV=${env.VERCEL_ENV ?? "unset"}).`,
    );
    return;
  }

  log("Applying pending Prisma migrations (VERCEL_ENV=production).");
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawn(pnpm, ["exec", "prisma", "migrate", "deploy"], {
    cwd: repoRoot,
    stdio: "inherit",
    env,
  });
  if (result.error || result.status !== 0) {
    const code = typeof result.status === "number" && result.status !== 0 ? result.status : 1;
    error(`prisma migrate deploy failed (exit ${code})`);
    exit(code);
  }
}

if (isDirectExecution(process.argv[1])) {
  runProductionMigrations();
}
