#!/usr/bin/env node
/**
 * List tasks that are completed (status = 'completed' or completedAt set) but have no plan (planId null).
 * Use this to find tasks that lost their plan link so you can reassign them in the UI or Prisma Studio.
 *
 * Usage: node scripts/list-orphaned-completed-tasks.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    where: {
      planId: null,
      OR: [{ status: "completed" }, { completedAt: { not: null } }],
    },
    select: { id: true, title: true, status: true, completedAt: true, userId: true },
    orderBy: [{ completedAt: "desc" }, { updatedAt: "desc" }],
  });

  if (tasks.length === 0) {
    console.log("No completed tasks with missing planId.");
    return;
  }

  console.log(`Found ${tasks.length} completed task(s) with no plan:\n`);
  for (const t of tasks) {
    const completed = t.completedAt ? t.completedAt.toISOString().slice(0, 10) : "—";
    console.log(`  ${t.id}  ${completed}  ${t.title.slice(0, 60)}${t.title.length > 60 ? "…" : ""}`);
  }
  console.log("\nReassign in the app via Edit Task → Plan dropdown, or in Prisma Studio.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
