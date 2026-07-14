import { apiFetch } from "../client.js";
import type { CliConfig } from "../config.js";
import { printJson, printTable, shortDate } from "../format.js";

type PlanRow = {
  id: string;
  name: string;
  status: string;
  priority: number;
  percentCompleted: number;
  updatedAt: string;
  startAt?: string | null;
  endAt?: string | null;
};

type PlansResponse = {
  plans: PlanRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type PlanResponse = { plan: PlanRow };

function printPlan(plan: PlanRow): void {
  printTable(
    ["id", "updated", "status", "pri", "%", "name"],
    [
      [
        plan.id,
        shortDate(plan.updatedAt),
        plan.status,
        String(plan.priority),
        String(plan.percentCompleted),
        plan.name,
      ],
    ],
  );
}

export async function runPlansList(
  config: CliConfig,
  options: {
    json: boolean;
    page?: string;
    limit?: string;
    showArchived: boolean;
  },
): Promise<void> {
  const body = (await apiFetch(config, "/plans", {
    query: {
      page: options.page,
      limit: options.limit,
      showArchived: options.showArchived ? "1" : undefined,
    },
  })) as PlansResponse;

  const plans = Array.isArray(body.plans) ? body.plans : [];

  if (options.json) {
    printJson(body);
    return;
  }

  process.stdout.write(
    `plans  page ${body.page ?? 1}/${body.totalPages ?? 1}  total ${body.total ?? plans.length}  @ ${config.baseUrl}\n\n`,
  );
  printTable(
    ["updated", "status", "pri", "%", "name"],
    plans.map((p) => [
      shortDate(p.updatedAt),
      p.status,
      String(p.priority),
      String(p.percentCompleted),
      p.name,
    ]),
  );
}

export async function runPlansGet(
  config: CliConfig,
  id: string,
  options: { json: boolean },
): Promise<void> {
  const body = (await apiFetch(config, `/plans/${id}`)) as PlanResponse;
  if (options.json) {
    printJson(body);
    return;
  }
  printPlan(body.plan);
}

export async function runPlansCreate(
  config: CliConfig,
  payload: Record<string, unknown>,
  options: { json: boolean },
): Promise<void> {
  const body = (await apiFetch(config, "/plans", {
    method: "POST",
    body: payload,
  })) as PlanResponse;
  if (options.json) {
    printJson(body);
    return;
  }
  process.stdout.write("created\n");
  printPlan(body.plan);
}

export async function runPlansUpdate(
  config: CliConfig,
  id: string,
  payload: Record<string, unknown>,
  options: { json: boolean },
): Promise<void> {
  const body = (await apiFetch(config, `/plans/${id}`, {
    method: "PATCH",
    body: payload,
  })) as PlanResponse;
  if (options.json) {
    printJson(body);
    return;
  }
  process.stdout.write("updated\n");
  printPlan(body.plan);
}

export async function runPlansDelete(
  config: CliConfig,
  id: string,
  options: { json: boolean; deleteTasks: boolean },
): Promise<void> {
  const body = await apiFetch(config, `/plans/${id}`, {
    method: "DELETE",
    query: { deleteTasks: options.deleteTasks ? "1" : "0" },
  });
  if (options.json) {
    printJson(body);
    return;
  }
  process.stdout.write(`deleted  ${id}${options.deleteTasks ? " (tasks removed)" : ""}\n`);
}
