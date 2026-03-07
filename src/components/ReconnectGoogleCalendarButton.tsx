"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

import { GOOGLE_AUTHORIZATION_PARAMS } from "@/lib/google-oauth";

export function ReconnectGoogleCalendarButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await signIn(
          "google",
          { callbackUrl: "/settings" },
          GOOGLE_AUTHORIZATION_PARAMS,
        );
      }}
      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Reconnecting..." : "Reconnect Google Calendar"}
    </button>
  );
}
