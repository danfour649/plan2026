"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useTranslations } from "@/components/TranslationsProvider";
import { createPlanInvite } from "@/lib/actions/plans";

export function InviteByLinkButton({ planId, planName }: { planId: string; planName: string }) {
  const t = useTranslations();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const result = await createPlanInvite(planId);
      if (result.success) {
        setInviteUrl(result.inviteUrl);
        await navigator.clipboard.writeText(result.inviteUrl);
        toast.success(t.toasts.inviteLinkCopied);
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
      toast.success(t.toasts.linkCopied);
    } catch {
      toast.error(t.toasts.failedToCopy);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 disabled:opacity-70 sm:justify-start"
        aria-label={t.common.inviteByLink}
      >
        {loading ? (
          <span className="sm:hidden" aria-hidden>
            <span className="inline-block size-5 animate-pulse rounded-full bg-blue-300" />
          </span>
        ) : (
          <span className="sm:hidden" aria-hidden>
            <UserPlus className="size-5" />
          </span>
        )}
        {loading ? (
          <span className="hidden sm:inline">{t.toasts.creating}</span>
        ) : (
          <span className="hidden sm:inline">{t.common.inviteByLink}</span>
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
              {t.common.copy}
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent(t.invite.emailSubject.replace("{{planName}}", planName))}&body=${encodeURIComponent(t.invite.emailBody.replace("{{planName}}", planName).replace("{{url}}", inviteUrl))}`}
              className="shrink-0 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
              aria-label={t.common.emailInvite}
            >
              {t.common.emailInvite}
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
