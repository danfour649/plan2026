"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createPlanInvite } from "@/lib/actions/plans";

export function InviteByLinkButton({ planId }: { planId: string }) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const result = await createPlanInvite(planId);
      if (result.success) {
        setInviteUrl(result.inviteUrl);
        await navigator.clipboard.writeText(result.inviteUrl);
        toast.success("Invite link copied to clipboard");
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 disabled:opacity-70"
      >
        {loading ? (
          "Creating…"
        ) : (
          <>
            <span className="sm:hidden">Invite</span>
            <span className="hidden sm:inline">Invite by link</span>
          </>
        )}
      </button>
      {inviteUrl ? (
        <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs text-zinc-600">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-blue-600 underline hover:text-blue-800"
            >
              {inviteUrl}
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
            >
              Copy
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
