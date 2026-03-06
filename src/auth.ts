import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "development" ? "dev-insecure-secret" : undefined);

const hasGoogleCredentials = Boolean(googleClientId && googleClientSecret);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: hasGoogleCredentials
    ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        }),
      ]
    : [],
  secret: authSecret,
  session: { strategy: "database" },
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

