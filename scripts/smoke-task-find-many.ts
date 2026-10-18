/**
 * CI smoke check: the Prisma client can read Task after `prisma migrate deploy`.
 * Uses DATABASE_URL from the environment. Does not print the URL.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const databaseUrl: string = connectionString;

function redact(message: string): string {
  return message.split(databaseUrl).join("[redacted]");
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const tasks = await prisma.task.findMany({ take: 1 });
    console.log(`prisma.task.findMany ok (${tasks.length} rows)`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "prisma.task.findMany failed";
  console.error(redact(message));
  process.exit(1);
});
