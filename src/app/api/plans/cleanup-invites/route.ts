import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/plans/cleanup-invites — delete expired plan invites.
 * Callable by an authenticated user or a cron with valid session.
 * Returns { deleted: number }.
 */
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await prisma.planInvite.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return NextResponse.json({ deleted: result.count });
}
