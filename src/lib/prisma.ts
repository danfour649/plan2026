import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { normalizePgDatabaseUrl } from "@/lib/normalize-pg-database-url";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPgPool?: Pool;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pgConnectionString = normalizePgDatabaseUrl(connectionString);
  if (!globalForPrisma.prismaPgPool) {
    const pool = new Pool({
      connectionString: pgConnectionString,
      max: 10,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
    pool.on("error", () => {
      // Swallow idle-client errors so they don't crash the process;
      // the pool will remove the dead connection and create a fresh one.
    });
    globalForPrisma.prismaPgPool = pool;
  }
  const adapter = new PrismaPg(globalForPrisma.prismaPgPool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
