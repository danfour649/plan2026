"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getCurrentUserId, revalidateAuthSessionCache } from "@/auth";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";
import { THEME_COOKIE, THEMES, type Theme } from "@/lib/theme";
import type { ActionResult } from "@/lib/actions/tasks";
import { prisma } from "@/lib/prisma";
import { updateUserPreferredLocale, updateUserPreferredTheme } from "@/lib/user-preference-sql";

function isAlreadyRevokedResponse(status: number, body: string): boolean {
  return status === 400 && /invalid token/i.test(body);
}

export async function disconnectGoogleCalendar(): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
    },
  });

  if (!account) {
    return { success: true };
  }

  const tokenToRevoke = account.refresh_token ?? account.access_token;
  if (tokenToRevoke) {
    try {
      const response = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token: tokenToRevoke }).toString(),
        cache: "no-store",
      });

      if (!response.ok) {
        const responseBody = await response.text();
        if (!isAlreadyRevokedResponse(response.status, responseBody)) {
          return {
            success: false,
            error: "Could not disconnect Google Calendar right now. Please try again.",
          };
        }
      }
    } catch {
      return {
        success: false,
        error: "Could not disconnect Google Calendar right now. Please try again.",
      };
    }
  }

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: null,
      refresh_token: null,
      expires_at: null,
      token_type: null,
      scope: null,
      session_state: null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/tasks");

  return { success: true };
}

export async function setLocale(formData: FormData): Promise<{ success: true } | { success: false; error: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const raw = formData.get("locale");
  const value = parseLocale(typeof raw === "string" ? raw : undefined);
  (await cookies()).set(LOCALE_COOKIE, value, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  await updateUserPreferredLocale(userId, value);
  await revalidateAuthSessionCache();
  revalidatePath("/", "layout");
  return { success: true };
}

export async function setTheme(formData: FormData): Promise<{ success: true } | { success: false; error: string }> {
  const raw = formData.get("theme");
  const theme = typeof raw === "string" && THEMES.includes(raw as Theme) ? (raw as Theme) : "system";
  (await cookies()).set(THEME_COOKIE, theme, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  const userId = await getCurrentUserId();
  if (userId) {
    await updateUserPreferredTheme(userId, theme);
    await revalidateAuthSessionCache();
  }
  revalidatePath("/", "layout");
  return { success: true };
}
