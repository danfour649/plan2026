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
  content?: string | null;
  planId?: string | null;
  plan: { id: string; name: string } | null;
};

type TasksResponse = { tasks: TaskRow[] };
type TaskResponse = { task: TaskRow; recurringAdvanced?: boolean };

function printTask(task: TaskRow): void {
  printTable(
    ["id", "updated", "status", "urg", "due", "plan", "title"],
    [
      [
        task.id,
        shortDate(task.updatedAt),
        task.status,
        String(task.urgency),
        shortDate(task.dueAt),
        task.plan?.name ?? task.planId ?? "-",
        task.title,
      ],
    ],
  );
}

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

  process.stdout.write(
    `tasks  ${tasks.length}${take ? ` (of ${body.tasks?.length ?? 0})` : ""}  @ ${config.baseUrl}\n\n`,
  );
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

export async function runTasksGet(
  config: CliConfig,
  id: string,
  options: { json: boolean },
): Promise<void> {
  const body = (await apiFetch(config, `/tasks/${id}`)) as TaskResponse;
  if (options.json) {
    printJson(body);
    return;
  }
  printTask(body.task);
}

export async function runTasksCreate(
  config: CliConfig,
  payload: {
    title: string;
    content?: string;
    dueAt?: string;
    urgency?: number;
    planId?: string;
    status?: "active" | "on_hold";
    recurrence?: string;
  },
  options: { json: boolean },
): Promise<void> {
  const body = (await apiFetch(config, "/tasks", {
    method: "POST",
    body: payload,
  })) as TaskResponse;
  if (options.json) {
    printJson(body);
    return;
  }
  process.stdout.write("created\n");
  printTask(body.task);
}

export async function runTasksUpdate(
  config: CliConfig,
  id: string,
  payload: Record<string, unknown>,
  options: { json: boolean },
): Promise<void> {
  const body = (await apiFetch(config, `/tasks/${id}`, {
    method: "PATCH",
    body: payload,
  })) as TaskResponse;
  if (options.json) {
    printJson(body);
    return;
  }
  process.stdout.write("updated\n");
  printTask(body.task);
}

export async function runTasksDelete(
  config: CliConfig,
  id: string,
  options: { json: boolean },
): Promise<void> {
  const body = await apiFetch(config, `/tasks/${id}`, { method: "DELETE" });
  if (options.json) {
    printJson(body);
    return;
  }
  process.stdout.write(`deleted  ${id}\n`);
}

export async function runTasksComplete(
  config: CliConfig,
  id: string,
  options: { json: boolean },
): Promise<void> {
  const body = (await apiFetch(config, `/tasks/${id}/complete`, {
    method: "POST",
  })) as TaskResponse;
  if (options.json) {
    printJson(body);
    return;
  }
  process.stdout.write(body.recurringAdvanced ? "advanced recurrence\n" : "completed\n");
  printTask(body.task);
}

export async function runTasksRestore(
  config: CliConfig,
  id: string,
  options: { json: boolean },
): Promise<void> {
  const body = (await apiFetch(config, `/tasks/${id}/restore`, {
    method: "POST",
  })) as TaskResponse;
  if (options.json) {
    printJson(body);
    return;
  }
  process.stdout.write("restored\n");
  printTask(body.task);
}
