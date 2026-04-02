"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useTranslations } from "@/components/TranslationsProvider";
import { createPlanShareLink } from "@/lib/actions/plans";

export function ShareByPublicLinkButton({ planId }: { planId: string }) {
  const t = useTranslations();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const result = await createPlanShareLink(planId);
      if (result.success) {
        setShareUrl(result.shareUrl);
        await navigator.clipboard.writeText(result.shareUrl);
        toast.success(t.toasts.inviteLinkCopied);
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
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
        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-purple-200/90 bg-purple-50 px-3 py-2 text-sm text-purple-950 transition hover:bg-purple-100 disabled:opacity-70 dark:border-purple-800/70 dark:bg-purple-950/50 dark:text-purple-100 dark:hover:bg-purple-900/55 sm:justify-start"
        aria-label={t.sharePlan.getPublicLink}
      >
        {loading ? (
          <span className="sm:hidden" aria-hidden>
            <span className="inline-block size-5 animate-pulse rounded-full bg-purple-400" />
          </span>
        ) : (
          <span className="sm:hidden" aria-hidden>
            <Link2 className="size-5" />
          </span>
        )}
        {loading ? (
          <span className="hidden sm:inline">{t.toasts.creating}</span>
        ) : (
          <span className="hidden sm:inline">{t.sharePlan.getPublicLink}</span>
        )}
      </button>
      {shareUrl ? (
        <div className="mt-2 rounded-xl border border-border bg-purple-50/60 px-3 py-2 text-xs text-zinc-600 dark:bg-purple-950/30">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-purple-800 underline hover:text-purple-950 dark:text-purple-200 dark:hover:text-purple-100"
            >
              {shareUrl}
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg border border-purple-200 bg-white px-2 py-1 text-xs font-medium text-purple-900 transition hover:bg-purple-50 dark:border-purple-800 dark:bg-zinc-900 dark:text-purple-100 dark:hover:bg-purple-950/40"
            >
              {t.common.copy}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
