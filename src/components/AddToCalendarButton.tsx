"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useTranslations } from "@/components/TranslationsProvider";
import { connectGoogleCalendar } from "@/lib/connect-google-calendar-client";
import { CALENDAR_SCOPE_MISSING_CODE } from "@/lib/google-oauth";

type AddToCalendarButtonProps = {
  taskId: string;
  initiallyLinked?: boolean;
};

export function AddToCalendarButton({
  taskId,
  initiallyLinked = false,
}: AddToCalendarButtonProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(initiallyLinked);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/calendar`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        htmlLink?: string;
        created?: boolean;
      };
      if (res.status === 403 && data.code === CALENDAR_SCOPE_MISSING_CODE) {
        await connectGoogleCalendar();
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? t.toasts.couldNotAddToCalendar);
        return;
      }
      setLinked(true);
      router.refresh();
      toast.success(data.created === false ? t.toasts.updatedInCalendar : t.toasts.addedToCalendar);
      if (data.htmlLink) {
        window.open(data.htmlLink, "_blank");
      }
    } catch {
      toast.error(t.toasts.couldNotAddToCalendar);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300 bg-blue-100 text-blue-700 transition hover:bg-blue-200 disabled:opacity-50 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/50 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
      title={linked ? t.toasts.updateInCalendar : t.toasts.addToCalendar}
      aria-label={linked ? t.toasts.updateInCalendar : t.toasts.addToCalendar}
    >
      {loading ? (
        <span aria-hidden="true" className="text-sm leading-none">
          …
        </span>
      ) : (
        <>
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <rect
              x="3"
              y="4"
              width="14"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M6 2.75V5.25M14 2.75V5.25M3 7.5H17"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {linked ? (
              <path
                d="M8 11.25L9.75 13L12.75 9.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M10 9.5V13.5M8 11.5H12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
          <span className="sr-only">
            {linked ? t.toasts.updateInCalendar : t.toasts.addToCalendar}
          </span>
        </>
      )}
    </button>
  );
}
