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
        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 disabled:opacity-70 sm:justify-start"
        aria-label={t.sharePlan.getPublicLink}
      >
        {loading ? (
          <span className="sm:hidden" aria-hidden>
            <span className="inline-block size-5 animate-pulse rounded-full bg-blue-300" />
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
        <div className="mt-2 rounded-xl border border-border bg-blue-50/50 px-3 py-2 text-xs text-zinc-600">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-accent-blue underline hover:text-blue-800"
            >
              {shareUrl}
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
            >
              {t.common.copy}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
