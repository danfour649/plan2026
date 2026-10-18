#!/usr/bin/env node
/**
 * Apply pending Prisma migrations only on a Vercel production build.
 *
 * The plan2026 Vercel project stores one DATABASE_URL for Production, Preview,
 * and Development. A preview build of an unmerged migration must not change
 * that database. GitHub Actions and local `pnpm run build` leave VERCEL_ENV
 * unset and must not connect.
 *
 * Invoked from the `build` script, which is what the Vercel production
 * deployment runs (`pnpm run build`).
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {boolean}
 */
export function shouldApplyProductionMigrations(env = process.env) {
  return env.VERCEL_ENV === "production";
}

function isDirectExecution() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

function applyMigrations() {
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(pnpm, ["exec", "prisma", "migrate", "deploy"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (isDirectExecution()) {
  if (shouldApplyProductionMigrations()) {
    console.log(
      "Applying pending Prisma migrations (VERCEL_ENV=production, DATABASE_URL).",
    );
    applyMigrations();
  } else {
    console.log(
      `Skipping prisma migrate deploy (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}).`,
    );
  }
}
