"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { disconnectGoogleCalendar } from "@/lib/actions/settings";
import type { ActionResult } from "@/lib/actions/tasks";

function wrapForActionState(
  fn: () => Promise<ActionResult>,
): (prev: ActionResult | null) => Promise<ActionResult> {
  return () => fn();
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Disconnecting..." : "Disconnect Google Calendar"}
    </button>
  );
}

export function DisconnectGoogleCalendarButton() {
  const [state, formAction] = useActionState(
    wrapForActionState(disconnectGoogleCalendar),
    null as ActionResult | null,
  );

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast.success("Google Calendar disconnected");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <SubmitButton />
    </form>
  );
}
