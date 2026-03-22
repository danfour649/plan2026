#!/usr/bin/env node
/**
 * Backfill Task.status = 'completed' for any task that has completedAt set.
 * Safe to run multiple times. Run after prisma generate / migrate if completed
 * tasks still show as 0 on plans list or plan detail.
 *
 * Usage: node scripts/backfill-task-status.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.task.updateMany({
    where: {
      completedAt: { not: null },
      status: { not: "completed" },
    },
    data: { status: "completed" },
  });
  console.log(`Backfilled ${result.count} task(s) to status = 'completed'.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
