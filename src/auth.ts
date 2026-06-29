import type { NextAuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth/next";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { cache } from "react";

import { isFacebookLoginEnabled } from "@/lib/facebook-login";
import { GOOGLE_SIGN_IN_PARAMS } from "@/lib/google-oauth";
import {
  memoAuthSessionClear,
  memoAuthSessionGet,
  memoAuthSessionResolve,
  type AuthSessionMemo,
} from "@/lib/runtime-rsc-memo";
import { prisma } from "@/lib/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const facebookClientId = process.env.AUTH_FACEBOOK_ID;
const facebookClientSecret = process.env.AUTH_FACEBOOK_SECRET;

/** Resolve secret at runtime so we don't throw during next build (when NODE_ENV is production but AUTH_SECRET is unset in CI). */
function getAuthSecret(): string | undefined {
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.AUTH_SECRET &&
    process.env.CI !== "true"
  ) {
    throw new Error("AUTH_SECRET environment variable is required in production");
  }
  return (
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development" ? crypto.randomUUID() : undefined)
  );
}

const hasGoogleCredentials = Boolean(googleClientId && googleClientSecret);
const hasFacebookCredentials =
  isFacebookLoginEnabled() && Boolean(facebookClientId && facebookClientSecret);

const providers: NextAuthOptions["providers"] = [];
if (hasGoogleCredentials) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
      authorization: {
        params: GOOGLE_SIGN_IN_PARAMS,
      },
    }),
  );
}
if (hasFacebookCredentials) {
  providers.push(
    FacebookProvider({
      clientId: facebookClientId!,
      clientSecret: facebookClientSecret!,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  // Runtime-compatible; adapter still types against legacy @prisma/client generics.
  adapter: PrismaAdapter(prisma as never),
  providers,
  get secret() {
    return getAuthSecret();
  },
  session: { strategy: "database" },
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  events: {
    signIn: async ({ user, account }) => {
      if (!user.id || !account) return;
      if (account.provider !== "google" && account.provider !== "facebook") return;

      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        update: {
          type: account.type,
          access_token: account.access_token ?? null,
          // Google may omit refresh_token on later logins, so keep the existing one
          // unless Google explicitly returns a replacement.
          refresh_token: account.refresh_token ?? undefined,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state:
            typeof account.session_state === "string" ? account.session_state : null,
        },
        create: {
          userId: user.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token ?? null,
          refresh_token: account.refresh_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state:
            typeof account.session_state === "string" ? account.session_state : null,
        },
      });
    },
  },
};

const NEXTAUTH_SESSION_COOKIE = "next-auth.session-token";
const NEXTAUTH_SESSION_COOKIE_SECURE = "__Secure-next-auth.session-token";

type ListPrefsUserIdEntry = { userId: string | null; staleAt: number };

/**
 * POST /api/list-prefs cannot rely on RSC `use cache` session; short TTL Session lookup.
 * Store on globalThis so duplicate `auth` bundles share one map (same issue as runtime-rsc-memo).
 */
const LIST_PREFS_USER_ID_CACHE_KEY = "__plan2026ListPrefsUserIdCache_v1" as const;

function getListPrefsUserIdCache(): Map<string, ListPrefsUserIdEntry> {
  const g = globalThis as typeof globalThis & {
    [LIST_PREFS_USER_ID_CACHE_KEY]?: Map<string, ListPrefsUserIdEntry>;
  };
  if (!g[LIST_PREFS_USER_ID_CACHE_KEY]) {
    g[LIST_PREFS_USER_ID_CACHE_KEY] = new Map();
  }
  return g[LIST_PREFS_USER_ID_CACHE_KEY];
}

/** Re-check Session row at most this often; always capped by `session.expires` (≥ 15 min policy). */
const LIST_PREFS_SESSION_TTL_MS = 60 * 60_000;
/** Invalid-token negative cache only — kept short on purpose. */
const LIST_PREFS_NEGATIVE_TTL_MS = 10_000;

/**
 * Look up session by token using only Prisma (no headers/cookies).
 * Used inside `use cache` so the cache callback does not access dynamic data.
 */
async function getSessionByToken(sessionToken: string) {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });
  if (!session || session.expires < new Date()) return null;
  const row: AuthSessionMemo = {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      preferredLocale: session.user.preferredLocale ?? null,
      preferredTheme: session.user.preferredTheme ?? null,
    },
    expires: session.expires.toISOString(),
  };
  return row;
}

/**
 * Session is cached in two ways:
 * 1. React cache() deduplicates within a single request (layout + page).
 * 2. `use cache` (Cache Components) keyed by session token reuses the
 *    Session + User result across navigations so tab switches don't hit the DB.
 * Cookie is read outside the cache; only the token string is passed into the cache.
 */
async function getSessionByTokenCached(sessionToken: string) {
  "use cache";
  cacheLife("max");
  cacheTag(`auth-session-${sessionToken}`);
  return getSessionByToken(sessionToken);
}

function getSessionByTokenCachedWithMemo(sessionToken: string) {
  return memoAuthSessionResolve(sessionToken, () => getSessionByTokenCached(sessionToken));
}

const getServerAuthSessionCached = cache(async () => {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(NEXTAUTH_SESSION_COOKIE)?.value ??
    cookieStore.get(NEXTAUTH_SESSION_COOKIE_SECURE)?.value;
  if (!sessionToken) return getServerSession(authOptions);
  return getSessionByTokenCachedWithMemo(sessionToken);
});

export function getServerAuthSession() {
  return getServerAuthSessionCached();
}

export async function getCurrentUserId() {
  return (await getServerAuthSession())?.user?.id ?? null;
}

/**
 * For lightweight API routes that only need to confirm login (e.g. setting list filter cookies).
 * Reuses the same in-process auth memo as `getServerAuthSession` (nav/layout) when still fresh,
 * then a Session-only Prisma row + long TTL map — avoids duplicate Session queries after RSC auth.
 */
export async function getCurrentUserIdForListPrefs(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(NEXTAUTH_SESSION_COOKIE)?.value ??
    cookieStore.get(NEXTAUTH_SESSION_COOKIE_SECURE)?.value;
  if (!sessionToken) return null;

  const authMemo = memoAuthSessionGet(sessionToken);
  if (authMemo !== undefined) {
    return authMemo?.user?.id ?? null;
  }

  const cache = getListPrefsUserIdCache();
  const now = Date.now();
  const hit = cache.get(sessionToken);
  if (hit !== undefined && hit.staleAt > now) {
    return hit.userId;
  }

  const row = await prisma.session.findUnique({
    where: { sessionToken },
    select: { userId: true, expires: true },
  });
  if (!row || row.expires < new Date()) {
    cache.set(sessionToken, {
      userId: null,
      staleAt: now + LIST_PREFS_NEGATIVE_TTL_MS,
    });
    return null;
  }

  const staleAt = Math.min(now + LIST_PREFS_SESSION_TTL_MS, row.expires.getTime());
  cache.set(sessionToken, { userId: row.userId, staleAt });
  return row.userId;
}

/** Invalidate cached session row (includes preferredLocale / preferredTheme) after settings change. */
export async function revalidateAuthSessionCache(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(NEXTAUTH_SESSION_COOKIE)?.value ??
    cookieStore.get(NEXTAUTH_SESSION_COOKIE_SECURE)?.value;
  if (sessionToken) {
    getListPrefsUserIdCache().delete(sessionToken);
    memoAuthSessionClear(sessionToken);
    revalidateTag(`auth-session-${sessionToken}`, "max");
  }
}

