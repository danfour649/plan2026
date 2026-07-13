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
};

type PlansResponse = {
  plans: PlanRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

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
