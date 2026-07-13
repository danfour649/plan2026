#!/usr/bin/env node
/**
 * Cross-platform entry: runs the TypeScript CLI via tsx.
 * Prefer `pnpm run cli -- …` from the repo root.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const entry = path.join(pkgRoot, "src", "index.ts");
const require = createRequire(import.meta.url);

let tsxCli;
try {
  tsxCli = require.resolve("tsx/cli");
} catch {
  console.error("tsx is required to run plan2026-api. From the repo root: pnpm install");
  process.exit(1);
}

const result = spawnSync(process.execPath, [tsxCli, entry, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
