"use client";

import { useState } from "react";
import { toast } from "sonner";

type AddToCalendarButtonProps = { taskId: string };

export function AddToCalendarButton({ taskId }: AddToCalendarButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/calendar`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; htmlLink?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Could not add to Google Calendar");
        return;
      }
      toast.success("Added to Google Calendar");
      if (data.htmlLink) {
        window.open(data.htmlLink, "_blank");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
      title="Add to Google Calendar"
    >
      {loading ? "…" : "Add to Calendar"}
    </button>
  );
}
