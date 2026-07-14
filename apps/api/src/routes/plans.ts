import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Prisma } from "@/generated/prisma/client";

import {
  createPlanForUser,
  deletePlanForUser,
  getPlanAccessForUser,
  getPlanForUser,
  updatePlanForUser,
} from "@/lib/plan-service";
import { prisma } from "@/lib/prisma";
import {
  createPlanSchema,
  isValidPlanId,
  PLAN_STATUS_VALUES,
  updatePlanSchema,
} from "@/lib/validations/plan";

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

const errorSchema = z.object({ error: z.string() });

const authErrorResponses = {
  401: {
    content: { "application/json": { schema: errorSchema } },
    description: "Unauthorized",
  },
  429: {
    content: { "application/json": { schema: errorSchema } },
    description: "Rate limited",
  },
} as const;

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

function serializePlan(plan: {
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
}) {
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

const planIdParam = z.object({ id: z.string().min(1) });

const planWriteBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  goal: z.string().optional(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  actualStartAt: z.string().optional(),
  actualEndAt: z.string().optional(),
  priority: z.number().int().min(1).max(7).optional(),
  percentCompleted: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
  color: z.string().optional(),
  imageUrl: z.string().optional(),
  taskIds: z.array(z.string()).optional(),
  status: z.enum(PLAN_STATUS_VALUES).optional(),
});

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
      description: "Paginated plan list for this account (owned + shared-with-me)",
    },
    ...authErrorResponses,
  },
});

const getPlanRoute = createRoute({
  method: "get",
  path: "/plans/{id}",
  tags: ["Plans"],
  summary: "Get one plan (owner or sharee)",
  security: [{ Bearer: [] }],
  request: { params: planIdParam },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ plan: planSchema }) } },
      description: "Plan",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Plan not found for this account",
    },
    ...authErrorResponses,
  },
});

const createPlanRoute = createRoute({
  method: "post",
  path: "/plans",
  tags: ["Plans"],
  summary: "Create a plan owned by the authenticated user",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: { "application/json": { schema: planWriteBodySchema } },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: z.object({ plan: planSchema }) } },
      description: "Plan created",
    },
    400: {
      content: { "application/json": { schema: errorSchema } },
      description: "Validation error",
    },
    ...authErrorResponses,
  },
});

const updatePlanRoute = createRoute({
  method: "patch",
  path: "/plans/{id}",
  tags: ["Plans"],
  summary: "Update a plan (owner only — sharees get 403)",
  security: [{ Bearer: [] }],
  request: {
    params: planIdParam,
    body: {
      content: { "application/json": { schema: planWriteBodySchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ plan: planSchema }) } },
      description: "Updated plan",
    },
    400: {
      content: { "application/json": { schema: errorSchema } },
      description: "Validation error",
    },
    403: {
      content: { "application/json": { schema: errorSchema } },
      description: "Shared plans are read-only for this account",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Plan not found for this account",
    },
    ...authErrorResponses,
  },
});

const deletePlanRoute = createRoute({
  method: "delete",
  path: "/plans/{id}",
  tags: ["Plans"],
  summary: "Delete a plan (owner only)",
  security: [{ Bearer: [] }],
  request: {
    params: planIdParam,
    query: z.object({
      deleteTasks: z.enum(["0", "1"]).optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ ok: z.literal(true) }) } },
      description: "Deleted",
    },
    403: {
      content: { "application/json": { schema: errorSchema } },
      description: "Shared plans cannot be deleted by this account",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Plan not found for this account",
    },
    ...authErrorResponses,
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

app.openapi(getPlanRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  if (!isValidPlanId(id)) return c.json({ error: "Plan not found" }, 404);

  const plan = await getPlanForUser(userId, id);
  if (!plan) return c.json({ error: "Plan not found" }, 404);
  return c.json({ plan: serializePlan(plan) }, 200);
});

app.openapi(createPlanRoute, async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const parsed = createPlanSchema.safeParse({
    name: body.name,
    description: body.description,
    goal: body.goal,
    startAt: body.startAt,
    endAt: body.endAt,
    actualStartAt: body.actualStartAt,
    actualEndAt: body.actualEndAt,
    priority: body.priority ?? 4,
    percentCompleted: body.percentCompleted ?? 0,
    notes: body.notes,
    color: body.color,
    imageUrl: body.imageUrl,
    taskIds: body.taskIds ?? [],
    newTasks: [],
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return c.json({ error: msg }, 400);
  }

  const result = await createPlanForUser(userId, parsed.data);
  if ("error" in result) return c.json({ error: result.error }, 400);
  if (!result.plan) return c.json({ error: "Failed to create plan" }, 400);
  return c.json({ plan: serializePlan(result.plan) }, 201);
});

app.openapi(updatePlanRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  if (!isValidPlanId(id)) return c.json({ error: "Plan not found" }, 404);

  const access = await getPlanAccessForUser(userId, id);
  if (!access) return c.json({ error: "Plan not found" }, 404);
  if (access === "shared") {
    return c.json({ error: "Forbidden: only the plan owner can update" }, 403);
  }

  const body = c.req.valid("json");
  const parsed = updatePlanSchema.safeParse({
    planId: id,
    name: body.name,
    description: body.description,
    goal: body.goal,
    startAt: body.startAt,
    endAt: body.endAt,
    actualStartAt: body.actualStartAt,
    actualEndAt: body.actualEndAt,
    priority: body.priority ?? 4,
    percentCompleted: body.percentCompleted ?? 0,
    notes: body.notes,
    color: body.color,
    imageUrl: body.imageUrl,
    taskIds: body.taskIds ?? [],
    newTasks: [],
    status: body.status ?? "draft",
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return c.json({ error: msg }, 400);
  }

  const result = await updatePlanForUser(userId, parsed.data);
  if ("error" in result) return c.json({ error: result.error }, 404);
  return c.json({ plan: serializePlan(result.plan) }, 200);
});

app.openapi(deletePlanRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  if (!isValidPlanId(id)) return c.json({ error: "Plan not found" }, 404);

  const access = await getPlanAccessForUser(userId, id);
  if (!access) return c.json({ error: "Plan not found" }, 404);
  if (access === "shared") {
    return c.json({ error: "Forbidden: only the plan owner can delete" }, 403);
  }

  const query = c.req.valid("query");
  const result = await deletePlanForUser(userId, id, {
    deleteAssociatedTasks: query.deleteTasks === "1",
  });
  if ("error" in result) return c.json({ error: result.error }, 404);
  return c.json({ ok: true as const }, 200);
});

export { app as plansApp };
