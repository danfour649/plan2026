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

  return (
    <>
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 disabled:opacity-70"
      >
        {loading ? "Creating…" : "Invite by link"}
      </button>
      {inviteUrl ? (
        <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs text-zinc-600">
          <p className="font-medium text-zinc-700">Link (copied):</p>
          <code className="break-all">{inviteUrl}</code>
        </div>
      ) : null}
    </>
  );
}
