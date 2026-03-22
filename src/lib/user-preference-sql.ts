import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Avoids Prisma `UserUpdateInput` / XOR typing issues when the IDE resolves an older generated client. */
export async function updateUserPreferredLocale(userId: string, locale: string): Promise<void> {
  await prisma.$executeRaw(
    Prisma.sql`UPDATE "User" SET "preferredLocale" = ${locale} WHERE "id" = ${userId}`,
  );
}

export async function updateUserPreferredTheme(userId: string, theme: string): Promise<void> {
  await prisma.$executeRaw(
    Prisma.sql`UPDATE "User" SET "preferredTheme" = ${theme} WHERE "id" = ${userId}`,
  );
}
