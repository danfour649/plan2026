import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { normalizePgDatabaseUrl } from "../../src/lib/normalize-pg-database-url";

export function createScriptPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }
  const pgConnectionString = normalizePgDatabaseUrl(connectionString);
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: pgConnectionString }),
  });
}
