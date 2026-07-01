import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createTaskForUser } from "@/lib/task-service";
import { prisma } from "@/lib/prisma";
import { addTaskSchema } from "@/lib/validations/task";

import type { ApiAuthVariables } from "@api/middleware/auth";
import { requireBearerAuth } from "@api/middleware/auth";

const app = new OpenAPIHono<{ Variables: ApiAuthVariables }>();

app.use("/*", requireBearerAuth);

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
      description: "Task list",
    },
    401: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Missing or invalid bearer token",
    },
    429: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Rate limited",
    },
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
  summary: "Create a task",
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
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Validation error",
    },
    401: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Unauthorized",
    },
    404: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Plan not found",
    },
    429: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Rate limited",
    },
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

  return c.json({ task: serializeTask(result.task) }, 201);
});

export { app as tasksApp };
