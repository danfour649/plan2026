"use client";

import { useState } from "react";

import { useTranslations } from "@/components/TranslationsProvider";
import { connectGoogleCalendar } from "@/lib/connect-google-calendar-client";

export function ReconnectGoogleCalendarButton() {
  const t = useTranslations();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await connectGoogleCalendar("/settings");
      }}
      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? t.calendar.reconnecting : t.calendar.reconnectGoogleCalendar}
    </button>
  );
}
