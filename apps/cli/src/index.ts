import { parseArgs } from "node:util";

import { ApiError } from "./client.js";
import { loadConfig } from "./config.js";
import { runHealth } from "./commands/health.js";
import { runPlansList } from "./commands/plans.js";
import { runTasksList } from "./commands/tasks.js";

const USAGE = `plan2026-api — CLI for the plan2026 HTTP API

Usage:
  plan2026-api health [--json] [--base-url <url>]
  plan2026-api tasks list [--status <status>] [--latest <n>] [--json] [--base-url <url>] [--token <token>]
  plan2026-api plans list [--page <n>] [--limit <n>] [--show-archived] [--json] [--base-url <url>] [--token <token>]

Env:
  PLAN2026_API_TOKEN       Bearer token (p26_…) — also loaded from repo-root .env
  PLAN2026_API_URL         API base URL (default https://api.plan2026.ca)

Examples (from plan2026 repo root):
  pnpm run cli -- health
  pnpm run cli -- tasks list --latest 15
  pnpm run cli -- plans list --limit 10
`;

function printUsage(): void {
  process.stdout.write(USAGE);
}

async function main(rawArgv: string[]): Promise<void> {
  // pnpm occasionally forwards a literal `--` when using filter/start wiring.
  const argv = rawArgv[0] === "--" ? rawArgv.slice(1) : rawArgv;

  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help" || argv[0] === "help") {
    printUsage();
    return;
  }

  const command = argv[0]!;
  const rest = argv.slice(1);

  if (command === "health") {
    const { values } = parseArgs({
      args: rest,
      options: {
        json: { type: "boolean", default: false },
        "base-url": { type: "string" },
        help: { type: "boolean", short: "h", default: false },
      },
      allowPositionals: false,
    });
    if (values.help) {
      printUsage();
      return;
    }
    const config = loadConfig({ baseUrl: values["base-url"] });
    await runHealth(config, { json: Boolean(values.json) });
    return;
  }

  if (command === "tasks") {
    const sub = rest[0];
    if (sub !== "list") {
      printUsage();
      process.exitCode = 1;
      return;
    }
    const { values } = parseArgs({
      args: rest.slice(1),
      options: {
        json: { type: "boolean", default: false },
        status: { type: "string" },
        latest: { type: "string" },
        limit: { type: "string" },
        "base-url": { type: "string" },
        token: { type: "string" },
        help: { type: "boolean", short: "h", default: false },
      },
      allowPositionals: false,
    });
    if (values.help) {
      printUsage();
      return;
    }
    const config = loadConfig({ baseUrl: values["base-url"], token: values.token });
    const latestRaw = values.latest ?? values.limit;
    const latest = latestRaw !== undefined ? Number(latestRaw) : undefined;
    if (latest !== undefined && (!Number.isFinite(latest) || latest < 1)) {
      throw new Error("--latest / --limit must be a positive integer");
    }
    await runTasksList(config, {
      json: Boolean(values.json),
      status: values.status,
      latest,
    });
    return;
  }

  if (command === "plans") {
    const sub = rest[0];
    if (sub !== "list") {
      printUsage();
      process.exitCode = 1;
      return;
    }
    const { values } = parseArgs({
      args: rest.slice(1),
      options: {
        json: { type: "boolean", default: false },
        page: { type: "string" },
        limit: { type: "string" },
        "show-archived": { type: "boolean", default: false },
        "base-url": { type: "string" },
        token: { type: "string" },
        help: { type: "boolean", short: "h", default: false },
      },
      allowPositionals: false,
    });
    if (values.help) {
      printUsage();
      return;
    }
    const config = loadConfig({ baseUrl: values["base-url"], token: values.token });
    await runPlansList(config, {
      json: Boolean(values.json),
      page: values.page,
      limit: values.limit,
      showArchived: Boolean(values["show-archived"]),
    });
    return;
  }

  printUsage();
  process.exitCode = 1;
}

main(process.argv.slice(2)).catch((err: unknown) => {
  if (err instanceof ApiError) {
    process.stderr.write(`${err.message}\n`);
    if (err.status === 401) {
      process.stderr.write(
        "Hint: token missing/invalid, or Pro entitlement required for personal API tokens.\n",
      );
    }
  } else if (err instanceof Error) {
    process.stderr.write(`${err.message}\n`);
  } else {
    process.stderr.write(`${String(err)}\n`);
  }
  process.exitCode = 1;
});
