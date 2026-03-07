import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth/next";

import { GOOGLE_AUTHORIZATION_PARAMS } from "@/lib/google-oauth";
import { prisma } from "@/lib/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: hasGoogleCredentials
    ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
          authorization: {
            params: GOOGLE_AUTHORIZATION_PARAMS,
          },
        }),
      ]
    : [],
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
      if (!user.id || account?.provider !== "google") return;

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

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUserId() {
  return (await getServerAuthSession())?.user?.id ?? null;
}

