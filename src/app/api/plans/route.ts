import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getCurrentUserId } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ARCHIVED_STATUSES = ["completed", "abandoned"] as const;
const DEFAULT_PLANS_PAGE_SIZE = 20;
const MAX_PLANS_PAGE_SIZE = 100;

function parsePage(value: string | null): number {
  const n = parseInt(String(value ?? "1"), 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

function parseLimit(value: string | null): number {
  const n = parseInt(String(value ?? DEFAULT_PLANS_PAGE_SIZE), 10);
  if (Number.isNaN(n) || n < 1) return DEFAULT_PLANS_PAGE_SIZE;
  return Math.min(n, MAX_PLANS_PAGE_SIZE);
}

/**
 * GET /api/plans — list plans for the signed-in user (owned + shared).
 * Query: page, limit, showArchived=1 to include completed/abandoned.
 */
export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = checkRateLimit(userId);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parsePage(searchParams.get("page"));
  const limit = parseLimit(searchParams.get("limit"));
  const showArchived = searchParams.get("showArchived") === "1";

  const baseWhere: Prisma.PlanWhereInput = {
    OR: [
      { userId },
      { shares: { some: { sharedWithUserId: userId } } },
    ],
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

  return NextResponse.json({
    plans,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  });
}
