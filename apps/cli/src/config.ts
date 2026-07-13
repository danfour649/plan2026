import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotenv } from "dotenv";

export const DEFAULT_API_BASE_URL = "https://api.plan2026.ca";

const packageSrcDir = path.dirname(fileURLToPath(import.meta.url));

/** Walk up from cwd (and this package) looking for a repo-root `.env`. */
function findEnvFile(): string | undefined {
  const starts = [process.cwd(), path.resolve(packageSrcDir, "../../..")];
  const seen = new Set<string>();

  for (const start of starts) {
    let dir = path.resolve(start);
    while (!seen.has(dir)) {
      seen.add(dir);
      const candidate = path.join(dir, ".env");
      if (fs.existsSync(candidate)) return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return undefined;
}

export type CliConfig = {
  baseUrl: string;
  token: string | undefined;
};

export function loadConfig(overrides: { baseUrl?: string; token?: string } = {}): CliConfig {
  const envPath = findEnvFile();
  if (envPath) {
    loadDotenv({ path: envPath, quiet: true });
  }

  const baseUrl = (
    overrides.baseUrl ??
    process.env.PLAN2026_API_URL ??
    process.env.PLAN2026_API_BASE_URL ??
    DEFAULT_API_BASE_URL
  )
    .trim()
    .replace(/\/+$/, "");

  const token = (overrides.token ?? process.env.PLAN2026_API_TOKEN)?.trim() || undefined;

  return { baseUrl, token };
}
