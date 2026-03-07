"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { useTranslations } from "@/components/TranslationsProvider";
import { disconnectGoogleCalendar } from "@/lib/actions/settings";
import type { ActionResult } from "@/lib/actions/tasks";

function wrapForActionState(
  fn: () => Promise<ActionResult>,
): (prev: ActionResult | null) => Promise<ActionResult> {
  return () => fn();
}

function SubmitButton() {
  const t = useTranslations();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? t.calendar.disconnecting : t.calendar.disconnectGoogleCalendar}
    </button>
  );
}

export function DisconnectGoogleCalendarButton() {
  const t = useTranslations();
  const [state, formAction] = useActionState(
    wrapForActionState(disconnectGoogleCalendar),
    null as ActionResult | null,
  );

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast.success(t.toasts.googleCalendarDisconnected);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t.toasts.googleCalendarDisconnected]);

  return (
    <form action={formAction}>
      <SubmitButton />
    </form>
  );
}
