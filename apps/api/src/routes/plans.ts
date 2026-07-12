import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import type { ApiAuthVariables } from "@api/middleware/auth";
import { requireBearerAuth } from "@api/middleware/auth";

const ARCHIVED_STATUSES = ["completed", "abandoned"] as const;
const DEFAULT_PLANS_PAGE_SIZE = 20;
const MAX_PLANS_PAGE_SIZE = 100;

function parsePage(value: string | undefined): number {
  const n = parseInt(String(value ?? "1"), 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

function parseLimit(value: string | undefined): number {
  const n = parseInt(String(value ?? DEFAULT_PLANS_PAGE_SIZE), 10);
  if (Number.isNaN(n) || n < 1) return DEFAULT_PLANS_PAGE_SIZE;
  return Math.min(n, MAX_PLANS_PAGE_SIZE);
}

const app = new OpenAPIHono<{ Variables: ApiAuthVariables }>();

app.use("/plans", requireBearerAuth);
app.use("/plans/*", requireBearerAuth);

const planTaskSummarySchema = z.object({
  id: z.string(),
  status: z.enum(["active", "on_hold", "completed"]),
  completedAt: z.string().datetime().nullable(),
});

const planSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  goal: z.string().nullable(),
  startAt: z.string().datetime().nullable(),
  endAt: z.string().datetime().nullable(),
  actualStartAt: z.string().datetime().nullable(),
  actualEndAt: z.string().datetime().nullable(),
  status: z.enum(["draft", "started", "on_hold", "completed", "abandoned"]),
  priority: z.number().int(),
  percentCompleted: z.number().int(),
  notes: z.string().nullable(),
  color: z.string().nullable(),
  imageUrl: z.string().nullable(),
  logoAttachmentId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tasks: z.array(planTaskSummarySchema),
});

function serializePlan(
  plan: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    goal: string | null;
    startAt: Date | null;
    endAt: Date | null;
    actualStartAt: Date | null;
    actualEndAt: Date | null;
    status: string;
    priority: number;
    percentCompleted: number;
    notes: string | null;
    color: string | null;
    imageUrl: string | null;
    logoAttachmentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    tasks: { id: string; status: "active" | "on_hold" | "completed"; completedAt: Date | null }[];
  },
) {
  return {
    id: plan.id,
    userId: plan.userId,
    name: plan.name,
    description: plan.description,
    goal: plan.goal,
    startAt: plan.startAt?.toISOString() ?? null,
    endAt: plan.endAt?.toISOString() ?? null,
    actualStartAt: plan.actualStartAt?.toISOString() ?? null,
    actualEndAt: plan.actualEndAt?.toISOString() ?? null,
    status: plan.status as "draft" | "started" | "on_hold" | "completed" | "abandoned",
    priority: plan.priority,
    percentCompleted: plan.percentCompleted,
    notes: plan.notes,
    color: plan.color,
    imageUrl: plan.imageUrl,
    logoAttachmentId: plan.logoAttachmentId,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    tasks: plan.tasks.map((task) => ({
      id: task.id,
      status: task.status,
      completedAt: task.completedAt?.toISOString() ?? null,
    })),
  };
}

const listPlansRoute = createRoute({
  method: "get",
  path: "/plans",
  tags: ["Plans"],
  summary: "List plans (owned and shared)",
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      showArchived: z.enum(["0", "1"]).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            plans: z.array(planSchema),
            total: z.number().int(),
            page: z.number().int(),
            limit: z.number().int(),
            totalPages: z.number().int(),
          }),
        },
      },
      description: "Paginated plan list",
    },
    401: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Unauthorized",
    },
    429: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Rate limited",
    },
  },
});

app.openapi(listPlansRoute, async (c) => {
  const userId = c.get("userId");
  const query = c.req.valid("query");
  const page = parsePage(query.page);
  const limit = parseLimit(query.limit);
  const showArchived = query.showArchived === "1";

  const baseWhere: Prisma.PlanWhereInput = {
    OR: [{ userId }, { shares: { some: { sharedWithUserId: userId } } }],
  };
  const where: Prisma.PlanWhereInput = showArchived
    ? baseWhere
    : { ...baseWhere, status: { notIn: [...ARCHIVED_STATUSES] } };

  const [plans, total] = await Promise.all([
    prisma.plan.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { tasks: { select: { id: true, status: true, completedAt: true } } },
    }),
    prisma.plan.count({ where }),
  ]);

  return c.json(
    {
      plans: plans.map(serializePlan),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    200,
  );
});

export { app as plansApp };
