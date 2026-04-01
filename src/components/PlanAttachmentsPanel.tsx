"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useTranslations } from "@/components/TranslationsProvider";
import { canUseAsPlanLogoContentType } from "@/lib/plan-upload-image";

const MAX_FILE_SIZE = 4.2 * 1024 * 1024;

type PlanAttachmentRow = {
  id: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
};

export function PlanAttachmentsPanel({
  planId,
  initialLogoAttachmentId,
}: {
  planId: string;
  initialLogoAttachmentId: string | null | undefined;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [attachments, setAttachments] = useState<PlanAttachmentRow[]>([]);
  const [logoId, setLogoId] = useState<string | null>(initialLogoAttachmentId ?? null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLogoId(initialLogoAttachmentId ?? null);
  }, [initialLogoAttachmentId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/plans/${planId}/attachments`)
      .then((r) => r.json())
      .then((data: { attachments?: PlanAttachmentRow[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          toast.error(t.planForm.failedToLoadPlanFiles);
          return;
        }
        setAttachments(Array.isArray(data.attachments) ? data.attachments : []);
      })
      .catch(() => {
        if (!cancelled) toast.error(t.planForm.failedToLoadPlanFiles);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [planId, t.planForm.failedToLoadPlanFiles]);

  const patchLogo = async (attachmentId: string | null) => {
    const res = await fetch(`/api/plans/${planId}/logo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentId }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; logoAttachmentId?: string | null };
    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : t.tasks.uploadFailed);
      return;
    }
    setLogoId(data.logoAttachmentId ?? null);
    router.refresh();
    toast.success(attachmentId ? t.planForm.planLogoSet : t.planForm.planLogoCleared);
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.planFilesHeading}</p>
        <p className="mt-1 text-xs text-muted">{t.planForm.planFilesHint}</p>
      </div>
      {logoId ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void patchLogo(null)}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-blue-50 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            {t.planForm.clearPlanLogo}
          </button>
        </div>
      ) : null}
      {loading ? (
        <p className="text-sm text-muted">{t.planForm.loadingPlanFiles}</p>
      ) : attachments.length > 0 ? (
        <ul className="flex flex-col gap-2 rounded-xl border border-border bg-blue-50/30 p-2 dark:bg-zinc-800/50">
          {attachments.map((a) => {
            const isLogo = logoId === a.id;
            const canLogo = canUseAsPlanLogoContentType(a.contentType);
            return (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-2 py-2 text-sm dark:bg-zinc-900"
              >
                <a
                  href={`/api/plans/${planId}/attachments/${a.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  {a.filename}
                </a>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {isLogo ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                      {t.planForm.planLogoBadge}
                    </span>
                  ) : null}
                  {canLogo && !isLogo ? (
                    <button
                      type="button"
                      onClick={() => void patchLogo(a.id)}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 transition hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-blue-200 dark:hover:bg-zinc-700"
                    >
                      {t.planForm.useAsPlanLogo}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch(`/api/plans/${planId}/attachments/${a.id}`, { method: "DELETE" });
                      if (!res.ok) {
                        const data = (await res.json().catch(() => ({}))) as { error?: string };
                        toast.error(typeof data.error === "string" ? data.error : t.tasks.failedToRemoveAttachment);
                        return;
                      }
                      setAttachments((prev) => prev.filter((x) => x.id !== a.id));
                      if (logoId === a.id) setLogoId(null);
                      router.refresh();
                    }}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-800 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200 dark:hover:bg-rose-900/40"
                    aria-label={`${t.common.remove} ${a.filename}`}
                  >
                    {t.common.remove}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t.planForm.noPlanFilesYet}</p>
      )}
      <label className="inline-flex w-fit cursor-pointer items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 transition hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-blue-200 dark:hover:bg-zinc-700">
        <input
          type="file"
          className="sr-only"
          disabled={uploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (file.size > MAX_FILE_SIZE) {
              toast.error(t.tasks.fileTooLarge);
              return;
            }
            setUploading(true);
            try {
              const fd = new FormData();
              fd.set("file", file);
              const res = await fetch(`/api/plans/${planId}/attachments`, { method: "POST", body: fd });
              const data = (await res.json().catch(() => ({}))) as PlanAttachmentRow & {
                error?: string;
                planLogoAttachmentId?: string | null;
              };
              if (!res.ok) {
                toast.error(typeof data.error === "string" ? data.error : t.tasks.uploadFailed);
                return;
              }
              if (data.id) {
                setAttachments((prev) => [
                  ...prev,
                  {
                    id: data.id,
                    url: data.url,
                    filename: data.filename,
                    size: data.size,
                    contentType: data.contentType,
                  },
                ]);
              }
              if ("planLogoAttachmentId" in data) {
                setLogoId(data.planLogoAttachmentId ?? null);
              }
              router.refresh();
              toast.success(t.tasks.fileAttached);
            } finally {
              setUploading(false);
            }
          }}
        />
        {uploading ? t.tasks.uploading : t.tasks.addFile}
      </label>
    </div>
  );
}
