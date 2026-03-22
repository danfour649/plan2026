/**
 * One-off: set planId for all tasks that currently have planId null.
 * Usage: pnpm exec tsx scripts/reassign-orphaned-tasks-to-plan.ts
 */

import { createScriptPrisma } from "./lib/prisma-for-scripts";

const prisma = createScriptPrisma();

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
    void prisma.$disconnect();
    process.exit(1);
  });
