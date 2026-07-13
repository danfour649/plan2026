import { apiFetch } from "../client.js";
import type { CliConfig } from "../config.js";
import { printJson, printTable, shortDate } from "../format.js";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  urgency: number;
  dueAt: string | null;
  updatedAt: string;
  plan: { id: string; name: string } | null;
};

type TasksResponse = { tasks: TaskRow[] };

export async function runTasksList(
  config: CliConfig,
  options: {
    json: boolean;
    status?: string;
    limit?: number;
    latest?: number;
  },
): Promise<void> {
  const body = (await apiFetch(config, "/tasks")) as TasksResponse;
  let tasks = Array.isArray(body.tasks) ? [...body.tasks] : [];

  if (options.status) {
    const want = options.status.toLowerCase();
    tasks = tasks.filter((t) => t.status.toLowerCase() === want);
  }

  tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const take = options.latest ?? options.limit;
  if (take !== undefined && take > 0) {
    tasks = tasks.slice(0, take);
  }

  if (options.json) {
    printJson({ tasks, total: body.tasks?.length ?? 0 });
    return;
  }

  process.stdout.write(`tasks  ${tasks.length}${take ? ` (of ${body.tasks?.length ?? 0})` : ""}  @ ${config.baseUrl}\n\n`);
  printTable(
    ["updated", "status", "urg", "due", "plan", "title"],
    tasks.map((t) => [
      shortDate(t.updatedAt),
      t.status,
      String(t.urgency),
      shortDate(t.dueAt),
      t.plan?.name ?? "-",
      t.title,
    ]),
  );
}
