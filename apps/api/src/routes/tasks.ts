import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { prisma } from "@/lib/prisma";
import { applyMarkTaskDone } from "@/lib/task-complete";
import {
  createTaskForUser,
  deleteTaskForUser,
  getTaskForUser,
  updateTaskForUser,
} from "@/lib/task-service";
import { addTaskSchema, isValidTaskId, updateTaskSchema } from "@/lib/validations/task";

import type { ApiAuthVariables } from "@api/middleware/auth";
import { requireBearerAuth } from "@api/middleware/auth";

const app = new OpenAPIHono<{ Variables: ApiAuthVariables }>();

app.use("/tasks", requireBearerAuth);
app.use("/tasks/*", requireBearerAuth);

const taskPlanSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .nullable();

const taskAttachmentSchema = z.object({
  id: z.string(),
  url: z.string(),
  filename: z.string(),
  size: z.number().int(),
});

const taskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  dueAt: z.string().datetime().nullable(),
  urgency: z.number().int(),
  status: z.enum(["active", "on_hold", "completed"]),
  completedAt: z.string().datetime().nullable(),
  planId: z.string().nullable(),
  recurrence: z.enum(["daily", "weekly", "monthly"]).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  plan: taskPlanSchema.optional(),
  attachments: z.array(taskAttachmentSchema).optional(),
});

const errorSchema = z.object({ error: z.string() });

function serializeTask(task: {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  dueAt: Date | null;
  urgency: number;
  status: "active" | "on_hold" | "completed";
  completedAt: Date | null;
  planId: string | null;
  recurrence: "daily" | "weekly" | "monthly" | null;
  createdAt: Date;
  updatedAt: Date;
  plan?: { id: string; name: string } | null;
  attachments?: { id: string; url: string; filename: string; size: number }[];
}) {
  return {
    id: task.id,
    userId: task.userId,
    title: task.title,
    content: task.content,
    dueAt: task.dueAt?.toISOString() ?? null,
    urgency: task.urgency,
    status: task.status,
    completedAt: task.completedAt?.toISOString() ?? null,
    planId: task.planId,
    recurrence: task.recurrence,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    ...(task.plan !== undefined ? { plan: task.plan } : {}),
    ...(task.attachments !== undefined ? { attachments: task.attachments } : {}),
  };
}

const authErrorResponses = {
  401: {
    content: { "application/json": { schema: errorSchema } },
    description: "Missing or invalid bearer token",
  },
  429: {
    content: { "application/json": { schema: errorSchema } },
    description: "Rate limited",
  },
} as const;

const listTasksRoute = createRoute({
  method: "get",
  path: "/tasks",
  tags: ["Tasks"],
  summary: "List tasks for the authenticated user",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ tasks: z.array(taskSchema) }),
        },
      },
      description: "Task list (only tasks owned by the authenticated account)",
    },
    ...authErrorResponses,
  },
});

const createTaskBodySchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  dueAt: z.string().optional(),
  urgency: z.number().int().min(1).max(7).optional(),
  planId: z.string().optional(),
  status: z.enum(["active", "on_hold"]).optional(),
  recurrence: z.string().optional(),
});

const createTaskRoute = createRoute({
  method: "post",
  path: "/tasks",
  tags: ["Tasks"],
  summary: "Create a task owned by the authenticated user",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createTaskBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ task: taskSchema }),
        },
      },
      description: "Task created",
    },
    400: {
      content: { "application/json": { schema: errorSchema } },
      description: "Validation error",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Plan not found (or not owned by this account)",
    },
    ...authErrorResponses,
  },
});

const taskIdParam = z.object({
  id: z.string().min(1),
});

const getTaskRoute = createRoute({
  method: "get",
  path: "/tasks/{id}",
  tags: ["Tasks"],
  summary: "Get one task owned by the authenticated user",
  security: [{ Bearer: [] }],
  request: { params: taskIdParam },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ task: taskSchema }) } },
      description: "Task",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Task not found for this account",
    },
    ...authErrorResponses,
  },
});

const updateTaskBodySchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  dueAt: z.string().optional(),
  urgency: z.number().int().min(1).max(7).optional(),
  planId: z.string().nullable().optional(),
  status: z.enum(["active", "on_hold"]).optional(),
  recurrence: z.string().optional(),
});

const updateTaskRoute = createRoute({
  method: "patch",
  path: "/tasks/{id}",
  tags: ["Tasks"],
  summary: "Update a task owned by the authenticated user",
  description:
    "Owner-scoped. Completed tasks keep status/completedAt until restored via POST /tasks/{id}/restore.",
  security: [{ Bearer: [] }],
  request: {
    params: taskIdParam,
    body: {
      content: {
        "application/json": {
          schema: updateTaskBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ task: taskSchema }) } },
      description: "Updated task",
    },
    400: {
      content: { "application/json": { schema: errorSchema } },
      description: "Validation error",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Task or linked plan not found for this account",
    },
    ...authErrorResponses,
  },
});

const deleteTaskRoute = createRoute({
  method: "delete",
  path: "/tasks/{id}",
  tags: ["Tasks"],
  summary: "Delete a task owned by the authenticated user",
  security: [{ Bearer: [] }],
  request: { params: taskIdParam },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ ok: z.literal(true) }) } },
      description: "Deleted",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Task not found for this account",
    },
    ...authErrorResponses,
  },
});

const completeTaskRoute = createRoute({
  method: "post",
  path: "/tasks/{id}/complete",
  tags: ["Tasks"],
  summary: "Mark a task done (owner only)",
  description: "Recurring tasks advance dueAt; non-recurring become completed.",
  security: [{ Bearer: [] }],
  request: { params: taskIdParam },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            task: taskSchema,
            recurringAdvanced: z.boolean(),
          }),
        },
      },
      description: "Task updated",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Task not found for this account",
    },
    ...authErrorResponses,
  },
});

const restoreTaskRoute = createRoute({
  method: "post",
  path: "/tasks/{id}/restore",
  tags: ["Tasks"],
  summary: "Restore a completed task to active (owner only)",
  security: [{ Bearer: [] }],
  request: { params: taskIdParam },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ task: taskSchema }) } },
      description: "Task restored",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Task not found for this account",
    },
    ...authErrorResponses,
  },
});

app.openapi(listTasksRoute, async (c) => {
  const userId = c.get("userId");
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { completedAt: "desc" }, { createdAt: "desc" }],
    include: {
      plan: { select: { id: true, name: true } },
      attachments: { select: { id: true, url: true, filename: true, size: true } },
    },
  });
  return c.json({ tasks: tasks.map(serializeTask) }, 200);
});

app.openapi(createTaskRoute, async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const parsed = addTaskSchema.safeParse({
    title: body.title ?? "",
    content: body.content,
    dueAt: body.dueAt,
    urgency: body.urgency ?? 4,
    planId: body.planId,
    status: body.status,
    recurrence: body.recurrence,
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return c.json({ error: msg }, 400);
  }

  const result = await createTaskForUser(userId, parsed.data);
  if ("error" in result) {
    if (result.error === "Plan not found") {
      return c.json({ error: result.error }, 404);
    }
    return c.json({ error: result.error }, 400);
  }

  const task = await getTaskForUser(userId, result.task.id);
  if (!task) return c.json({ error: "Task not found" }, 404);
  return c.json({ task: serializeTask(task) }, 201);
});

app.openapi(getTaskRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  if (!isValidTaskId(id)) return c.json({ error: "Task not found" }, 404);

  const task = await getTaskForUser(userId, id);
  if (!task) return c.json({ error: "Task not found" }, 404);
  return c.json({ task: serializeTask(task) }, 200);
});

app.openapi(updateTaskRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  if (!isValidTaskId(id)) return c.json({ error: "Task not found" }, 404);

  const body = c.req.valid("json");
  const parsed = updateTaskSchema.safeParse({
    taskId: id,
    title: body.title ?? "",
    content: body.content,
    dueAt: body.dueAt,
    urgency: body.urgency ?? 4,
    planId: body.planId === null ? undefined : body.planId,
    status: body.status,
    recurrence: body.recurrence,
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return c.json({ error: msg }, 400);
  }

  const result = await updateTaskForUser(userId, id, {
    title: parsed.data.title,
    content: parsed.data.content,
    dueAt: parsed.data.dueAt,
    recurrence: parsed.data.recurrence,
    urgency: parsed.data.urgency,
    planId: body.planId === undefined ? undefined : body.planId,
    status: parsed.data.status,
  });

  if ("error" in result) {
    if (result.error === "Plan not found") return c.json({ error: result.error }, 404);
    return c.json({ error: result.error }, 400);
  }
  if (result.count === 0) return c.json({ error: "Task not found" }, 404);

  const task = await getTaskForUser(userId, id);
  if (!task) return c.json({ error: "Task not found" }, 404);
  return c.json({ task: serializeTask(task) }, 200);
});

app.openapi(deleteTaskRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  if (!isValidTaskId(id)) return c.json({ error: "Task not found" }, 404);

  const result = await deleteTaskForUser(userId, id);
  if ("error" in result) return c.json({ error: result.error }, 404);
  return c.json({ ok: true as const }, 200);
});

app.openapi(completeTaskRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  if (!isValidTaskId(id)) return c.json({ error: "Task not found" }, 404);

  const { ok, recurringAdvanced } = await applyMarkTaskDone({ id, userId });
  if (!ok) return c.json({ error: "Task not found" }, 404);

  const task = await getTaskForUser(userId, id);
  if (!task) return c.json({ error: "Task not found" }, 404);
  return c.json({ task: serializeTask(task), recurringAdvanced }, 200);
});

app.openapi(restoreTaskRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  if (!isValidTaskId(id)) return c.json({ error: "Task not found" }, 404);

  const result = await prisma.task.updateMany({
    where: { id, userId },
    data: { status: "active", completedAt: null },
  });
  if (result.count === 0) return c.json({ error: "Task not found" }, 404);

  const task = await getTaskForUser(userId, id);
  if (!task) return c.json({ error: "Task not found" }, 404);
  return c.json({ task: serializeTask(task) }, 200);
});

export { app as tasksApp };
