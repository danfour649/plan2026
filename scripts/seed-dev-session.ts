import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const email = "dev@example.com";
  // preferredLocale/preferredTheme are set so the first authenticated render does not
  // trigger the cookie-backfill path in account-preferences.ts (which calls
  // revalidateAuthSessionCache during render and errors under Cache Components).
  const user = await prisma.user.upsert({
    where: { email },
    update: { preferredLocale: "en", preferredTheme: "system" },
    create: { email, name: "Dev User", preferredLocale: "en", preferredTheme: "system" },
  });

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  console.log("USER_ID=" + user.id);
  console.log("SESSION_TOKEN=" + sessionToken);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
