import { prisma } from "@/lib/prisma";
import { API_TOKEN_PREFIX, extractBearerToken, hashApiToken } from "@/lib/api-auth-utils";
import { userHasProEntitlement } from "@/lib/revenuecat-server";

export { API_TOKEN_PREFIX, extractBearerToken, hashApiToken, safeEqualStrings } from "@/lib/api-auth-utils";

async function resolveUserIdFromApiToken(token: string): Promise<string | null> {
  if (!token.startsWith(API_TOKEN_PREFIX)) return null;
  const tokenHash = hashApiToken(token);
  const row = await prisma.apiToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true },
  });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;

  // Personal API tokens are a Pro feature — reject if entitlement lapsed.
  if (!(await userHasProEntitlement(row.userId))) return null;

  void prisma.apiToken
    .update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return row.userId;
}

async function resolveUserIdFromSessionToken(sessionToken: string): Promise<string | null> {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    select: { userId: true, expires: true },
  });
  if (!session || session.expires < new Date()) return null;
  return session.userId;
}

/**
 * Resolve a signed-in user id from an HTTP Authorization header.
 * Supports personal API tokens (`p26_…`) and NextAuth database session tokens.
 */
export async function resolveUserIdFromAuthorization(
  authorization: string | undefined,
): Promise<string | null> {
  const token = extractBearerToken(authorization);
  if (!token) return null;

  if (token.startsWith(API_TOKEN_PREFIX)) {
    return resolveUserIdFromApiToken(token);
  }

  return resolveUserIdFromSessionToken(token);
}
