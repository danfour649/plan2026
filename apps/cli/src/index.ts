import { parseArgs } from "node:util";

import { ApiError } from "./client.js";
import { loadConfig } from "./config.js";
import { runHealth } from "./commands/health.js";
import {
  runPlansCreate,
  runPlansDelete,
  runPlansGet,
  runPlansList,
  runPlansUpdate,
} from "./commands/plans.js";
import {
  runTasksComplete,
  runTasksCreate,
  runTasksDelete,
  runTasksGet,
  runTasksList,
  runTasksRestore,
  runTasksUpdate,
} from "./commands/tasks.js";

const USAGE = `plan2026-api — CLI for the plan2026 HTTP API

Usage:
  plan2026-api health [--json]
  plan2026-api tasks list [--status <s>] [--latest <n>] [--json]
  plan2026-api tasks get <id> [--json]
  plan2026-api tasks create --title <t> [--content <c>] [--due-at <iso>] [--urgency <1-7>] [--plan-id <id>] [--status active|on_hold] [--recurrence daily|weekly|monthly] [--json]
  plan2026-api tasks update <id> --title <t> [same create flags] [--clear-plan] [--json]
  plan2026-api tasks delete <id> [--json]
  plan2026-api tasks complete <id> [--json]
  plan2026-api tasks restore <id> [--json]
  plan2026-api plans list [--page <n>] [--limit <n>] [--show-archived] [--json]
  plan2026-api plans get <id> [--json]
  plan2026-api plans create --name <n> --start-at <iso> --end-at <iso> [--priority <1-7>] [--status draft|…] [--json]
  plan2026-api plans update <id> --name <n> --start-at <iso> --end-at <iso> --status <s> [same flags] [--json]
  plan2026-api plans delete <id> [--delete-tasks] [--json]

Global flags: --base-url <url>  --token <token>

Env:
  PLAN2026_API_TOKEN   Bearer token (p26_…) — also loaded from repo-root .env
  PLAN2026_API_URL     API base URL (default https://api.plan2026.ca)

Security: all mutating calls are scoped to the token's account. Shared plans are
readable; only the owner can update/delete. Tasks are never visible across accounts.

Examples:
  pnpm run cli -- tasks list --latest 15
  pnpm run cli -- tasks create --title "Ship CLI CRUD"
  pnpm run cli -- plans create --name "Q3" --start-at 2026-07-01 --end-at 2026-09-30
`;

const globalOpts = {
  json: { type: "boolean", default: false },
  "base-url": { type: "string" },
  token: { type: "string" },
  help: { type: "boolean", short: "h", default: false },
} as const;

function printUsage(): void {
  process.stdout.write(USAGE);
}

function configFrom(values: { "base-url"?: string; token?: string }) {
  return loadConfig({ baseUrl: values["base-url"], token: values.token });
}

const GLOBAL_FLAG_KEYS = new Set(["--json", "--base-url", "--token", "-h", "--help"]);

/** Pull leading global flags so `cli --base-url X health` works like `cli health --base-url X`. */
function extractLeadingGlobals(argv: string[]): { globals: string[]; rest: string[] } {
  const globals: string[] = [];
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i]!;
    if (arg === "--") {
      i += 1;
      break;
    }
    if (!arg.startsWith("-")) break;
    if (arg === "--json" || arg === "-h" || arg === "--help") {
      globals.push(arg);
      i += 1;
      continue;
    }
    if (arg.startsWith("--base-url=") || arg.startsWith("--token=")) {
      globals.push(arg);
      i += 1;
      continue;
    }
    if (arg === "--base-url" || arg === "--token") {
      globals.push(arg);
      i += 1;
      if (i < argv.length && !argv[i]!.startsWith("-")) {
        globals.push(argv[i]!);
        i += 1;
      }
      continue;
    }
    // Unknown leading flag — leave for subcommand parsers.
    if (!GLOBAL_FLAG_KEYS.has(arg.split("=")[0]!)) break;
    break;
  }
  return { globals, rest: argv.slice(i) };
}

async function main(rawArgv: string[]): Promise<void> {
  const stripped = rawArgv[0] === "--" ? rawArgv.slice(1) : rawArgv;
  const { globals, rest: argv } = extractLeadingGlobals(stripped);

  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help" || argv[0] === "help") {
    printUsage();
    return;
  }

  const command = argv[0]!;
  const commandArgs = argv.slice(1);

  if (command === "health") {
    const { values } = parseArgs({
      args: [...globals, ...commandArgs],
      options: globalOpts,
      allowPositionals: false,
    });
    if (values.help) return printUsage();
    await runHealth(configFrom(values), { json: Boolean(values.json) });
    return;
  }

  if (command === "tasks") {
    const sub = commandArgs[0];
    const subArgs = [...globals, ...commandArgs.slice(1)];
    if (!sub || sub === "-h" || sub === "--help") {
      printUsage();
      process.exitCode = sub ? 0 : 1;
      return;
    }

    if (sub === "list") {
      const { values } = parseArgs({
        args: subArgs,
        options: {
          ...globalOpts,
          status: { type: "string" },
          latest: { type: "string" },
          limit: { type: "string" },
        },
        allowPositionals: false,
      });
      if (values.help) return printUsage();
      const latestRaw = values.latest ?? values.limit;
      const latest = latestRaw !== undefined ? Number(latestRaw) : undefined;
      if (latest !== undefined && (!Number.isFinite(latest) || latest < 1)) {
        throw new Error("--latest / --limit must be a positive integer");
      }
      await runTasksList(configFrom(values), {
        json: Boolean(values.json),
        status: values.status,
        latest,
      });
      return;
    }

    if (sub === "get" || sub === "delete" || sub === "complete" || sub === "restore") {
      const { values, positionals } = parseArgs({
        args: subArgs,
        options: globalOpts,
        allowPositionals: true,
      });
      if (values.help) return printUsage();
      const id = positionals[0];
      if (!id) throw new Error(`tasks ${sub} requires <id>`);
      const config = configFrom(values);
      const json = Boolean(values.json);
      if (sub === "get") await runTasksGet(config, id, { json });
      else if (sub === "delete") await runTasksDelete(config, id, { json });
      else if (sub === "complete") await runTasksComplete(config, id, { json });
      else await runTasksRestore(config, id, { json });
      return;
    }

    if (sub === "create" || sub === "update") {
      const { values, positionals } = parseArgs({
        args: subArgs,
        options: {
          ...globalOpts,
          title: { type: "string" },
          content: { type: "string" },
          "due-at": { type: "string" },
          urgency: { type: "string" },
          "plan-id": { type: "string" },
          "clear-plan": { type: "boolean", default: false },
          status: { type: "string" },
          recurrence: { type: "string" },
        },
        allowPositionals: true,
      });
      if (values.help) return printUsage();
      if (!values.title) throw new Error("--title is required");
      const urgency = values.urgency !== undefined ? Number(values.urgency) : undefined;
      if (urgency !== undefined && (!Number.isFinite(urgency) || urgency < 1 || urgency > 7)) {
        throw new Error("--urgency must be an integer 1–7");
      }
      const status = values.status as "active" | "on_hold" | undefined;
      if (status && status !== "active" && status !== "on_hold") {
        throw new Error("--status must be active or on_hold");
      }

      const payload: Record<string, unknown> = {
        title: values.title,
        content: values.content,
        dueAt: values["due-at"],
        urgency,
        status,
        recurrence: values.recurrence,
      };
      if (values["clear-plan"]) payload.planId = null;
      else if (values["plan-id"]) payload.planId = values["plan-id"];

      const config = configFrom(values);
      const json = Boolean(values.json);
      if (sub === "create") {
        await runTasksCreate(
          config,
          payload as {
            title: string;
            content?: string;
            dueAt?: string;
            urgency?: number;
            planId?: string;
            status?: "active" | "on_hold";
            recurrence?: string;
          },
          { json },
        );
      } else {
        const id = positionals[0];
        if (!id) throw new Error("tasks update requires <id>");
        await runTasksUpdate(config, id, payload, { json });
      }
      return;
    }

    printUsage();
    process.exitCode = 1;
    return;
  }

  if (command === "plans") {
    const sub = commandArgs[0];
    const subArgs = [...globals, ...commandArgs.slice(1)];
    if (!sub || sub === "-h" || sub === "--help") {
      printUsage();
      process.exitCode = sub ? 0 : 1;
      return;
    }

    if (sub === "list") {
      const { values } = parseArgs({
        args: subArgs,
        options: {
          ...globalOpts,
          page: { type: "string" },
          limit: { type: "string" },
          "show-archived": { type: "boolean", default: false },
        },
        allowPositionals: false,
      });
      if (values.help) return printUsage();
      await runPlansList(configFrom(values), {
        json: Boolean(values.json),
        page: values.page,
        limit: values.limit,
        showArchived: Boolean(values["show-archived"]),
      });
      return;
    }

    if (sub === "get" || sub === "delete") {
      const { values, positionals } = parseArgs({
        args: subArgs,
        options: {
          ...globalOpts,
          "delete-tasks": { type: "boolean", default: false },
        },
        allowPositionals: true,
      });
      if (values.help) return printUsage();
      const id = positionals[0];
      if (!id) throw new Error(`plans ${sub} requires <id>`);
      const config = configFrom(values);
      const json = Boolean(values.json);
      if (sub === "get") await runPlansGet(config, id, { json });
      else {
        await runPlansDelete(config, id, {
          json,
          deleteTasks: Boolean(values["delete-tasks"]),
        });
      }
      return;
    }

    if (sub === "create" || sub === "update") {
      const { values, positionals } = parseArgs({
        args: subArgs,
        options: {
          ...globalOpts,
          name: { type: "string" },
          description: { type: "string" },
          goal: { type: "string" },
          "start-at": { type: "string" },
          "end-at": { type: "string" },
          priority: { type: "string" },
          "percent-completed": { type: "string" },
          notes: { type: "string" },
          status: { type: "string" },
        },
        allowPositionals: true,
      });
      if (values.help) return printUsage();
      if (!values.name) throw new Error("--name is required");
      if (!values["start-at"] || !values["end-at"]) {
        throw new Error("--start-at and --end-at are required (ISO dates)");
      }
      const priority = values.priority !== undefined ? Number(values.priority) : undefined;
      const percentCompleted =
        values["percent-completed"] !== undefined ? Number(values["percent-completed"]) : undefined;

      const payload: Record<string, unknown> = {
        name: values.name,
        description: values.description,
        goal: values.goal,
        startAt: values["start-at"],
        endAt: values["end-at"],
        priority,
        percentCompleted,
        notes: values.notes,
        status: values.status,
      };

      const config = configFrom(values);
      const json = Boolean(values.json);
      if (sub === "create") {
        await runPlansCreate(config, payload, { json });
      } else {
        const id = positionals[0];
        if (!id) throw new Error("plans update requires <id>");
        if (!values.status) throw new Error("plans update requires --status");
        await runPlansUpdate(config, id, payload, { json });
      }
      return;
    }

    printUsage();
    process.exitCode = 1;
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
    if (err.status === 403) {
      process.stderr.write("Hint: shared plans are read-only; only the owner can mutate.\n");
    }
  } else if (err instanceof Error) {
    process.stderr.write(`${err.message}\n`);
  } else {
    process.stderr.write(`${String(err)}\n`);
  }
  process.exitCode = 1;
});
