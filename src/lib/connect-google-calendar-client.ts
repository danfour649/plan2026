"use client";

import { signIn } from "next-auth/react";

import { GOOGLE_CALENDAR_PARAMS } from "@/lib/google-oauth";

/** Start incremental Google OAuth to grant calendar.events scope. */
export function connectGoogleCalendar(callbackUrl?: string) {
  const url =
    callbackUrl ??
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/tasks");
  return signIn("google", { callbackUrl: url }, GOOGLE_CALENDAR_PARAMS);
}
