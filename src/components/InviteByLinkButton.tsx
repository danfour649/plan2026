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
        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-yellow-100 bg-yellow-50/90 px-3 py-2 text-sm text-yellow-700 transition hover:bg-yellow-100/80 disabled:opacity-70 dark:border-yellow-900/35 dark:bg-yellow-950/35 dark:text-yellow-200 dark:hover:bg-yellow-950/55 sm:justify-start"
        aria-label={t.common.inviteByLink}
      >
        {loading ? (
          <span className="sm:hidden" aria-hidden>
            <span className="inline-block size-5 animate-pulse rounded-full bg-yellow-300" />
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
        <div className="mt-2 rounded-xl border border-border bg-yellow-50/50 px-3 py-2 text-xs text-zinc-600 dark:bg-yellow-950/20">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-yellow-700 underline hover:text-yellow-800 dark:text-yellow-200 dark:hover:text-yellow-100"
            >
              {inviteUrl}
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg border border-yellow-100 bg-white px-2 py-1 text-xs font-medium text-yellow-700 transition hover:bg-yellow-50/90 dark:border-yellow-900/40 dark:bg-zinc-900 dark:text-yellow-200 dark:hover:bg-yellow-950/35"
            >
              {t.common.copy}
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent(t.invite.emailSubject.replace("{{planName}}", planName))}&body=${encodeURIComponent(t.invite.emailBody.replace("{{planName}}", planName).replace("{{url}}", inviteUrl))}`}
              className="shrink-0 rounded-lg border border-yellow-100 bg-white px-2 py-1 text-xs font-medium text-yellow-700 transition hover:bg-yellow-50/90 dark:border-yellow-900/40 dark:bg-zinc-900 dark:text-yellow-200 dark:hover:bg-yellow-950/35"
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
