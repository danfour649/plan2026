import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      preferredLocale?: string | null;
      preferredTheme?: string | null;
    } & DefaultSession["user"];
  }
}

