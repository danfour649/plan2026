"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateTaskStatusByShareToken } from "@/lib/actions/share";

export function SharePageTaskRow({
  token,
  taskId,
  completedAt,
  allowStatusUpdate,
  title,
  markDoneLabel,
  restoreLabel,
}: {
  token: string;
  taskId: string;
  completedAt: Date | null;
  allowStatusUpdate: boolean;
  title: string;
  markDoneLabel: string;
  restoreLabel: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (!allowStatusUpdate || pending) return;
    setPending(true);
    try {
      const result = await updateTaskStatusByShareToken(
        token,
        taskId,
        completedAt ? null : new Date(),
      );
      if (result.success) router.refresh();
      else if (result.error) alert(result.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
      <span className={completedAt ? "text-zinc-500 line-through" : ""}>{title}</span>
      {allowStatusUpdate ? (
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-70"
        >
          {completedAt ? restoreLabel : markDoneLabel}
        </button>
      ) : null}
    </li>
  );
}
