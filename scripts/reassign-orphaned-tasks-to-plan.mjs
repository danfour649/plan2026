#!/usr/bin/env node
/**
 * One-off: set planId for all tasks that currently have planId null.
 * Usage: node scripts/reassign-orphaned-tasks-to-plan.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_PLAN_ID = "cmmftd9i20001lb04kgvm269t";

async function main() {
  const result = await prisma.task.updateMany({
    where: { planId: null },
    data: { planId: TARGET_PLAN_ID },
  });
  console.log(`Updated ${result.count} task(s) to planId = ${TARGET_PLAN_ID}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
