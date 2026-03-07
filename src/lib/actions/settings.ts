"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/auth";
import type { ActionResult } from "@/lib/actions/tasks";
import { prisma } from "@/lib/prisma";

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
