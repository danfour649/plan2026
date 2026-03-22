"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CancelNewPlanLink } from "@/components/CancelNewPlanLink";
import { PlanForm } from "@/components/PlanForm";
import { clearNewPlanFormDirty, setNewPlanFormDirty } from "@/lib/newPlanDirty";
import type { PlanActionResult } from "@/lib/actions/plans";
import type { PlanTemplateResolved } from "@/data/planTemplates";

type NewPlanSectionProps = {
  action: (formData: FormData) => Promise<PlanActionResult>;
  templates: PlanTemplateResolved[];
  templateSelectLabel: string;
  cancelLabel: string;
  confirmMessage: string;
  discardLeaveLabel: string;
  discardStayLabel: string;
  newPlanTitle: string;
  newPlanDescription: string;
  createPlanLabel: string;
};

export function NewPlanSection({
  action,
  templates,
  templateSelectLabel,
  cancelLabel,
  confirmMessage,
  discardLeaveLabel,
  discardStayLabel,
  newPlanTitle,
  newPlanDescription,
  createPlanLabel,
}: NewPlanSectionProps) {
  const router = useRouter();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id ?? "empty");

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const templateInitialValues =
    selectedTemplate && selectedTemplate.id !== "empty"
      ? {
          name: selectedTemplate.name,
          goal: selectedTemplate.goal ?? "",
          newTaskTitles:
            selectedTemplate.tasks.length > 0
              ? selectedTemplate.tasks.map((t) => t.title)
              : [""],
        }
      : undefined;

  useEffect(() => {
    return () => clearNewPlanFormDirty();
  }, []);

  useEffect(() => {
    if (!showDiscardConfirm) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowDiscardConfirm(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDiscardConfirm]);

  const handleLeave = () => {
    clearNewPlanFormDirty();
    setShowDiscardConfirm(false);
    router.push("/plans");
  };

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-3">
        <CancelNewPlanLink label={cancelLabel} onRequestConfirm={setShowDiscardConfirm} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-950 dark:text-zinc-100">{newPlanTitle}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{newPlanDescription}</p>
        </div>
        {templates.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="plan-template-select" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {templateSelectLabel}
            </label>
            <select
              id="plan-template-select"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
              aria-label={templateSelectLabel}
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <section className="rounded-2xl border border-blue-100 bg-white/90 px-6 py-6 shadow-sm shadow-blue-100/40 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <PlanForm
          key={selectedTemplateId}
          formId="new-plan-form"
          action={action}
          linkableTasksScope="all"
          isEdit={false}
          submitLabel={createPlanLabel}
          discardConfirmMessage={confirmMessage}
          onDirtyChange={setNewPlanFormDirty}
          onRequestDiscardConfirm={setShowDiscardConfirm}
          templateInitialValues={templateInitialValues}
        />
      </section>

      {showDiscardConfirm ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-zinc-950/45 px-4 py-6"
          onClick={() => setShowDiscardConfirm(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md shrink-0 rounded-2xl border border-blue-100 bg-white px-6 py-5 shadow-2xl shadow-blue-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-950/50"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-confirm-title"
          >
            <h2 id="discard-confirm-title" className="text-lg font-semibold tracking-tight text-blue-950 dark:text-zinc-100">
              {confirmMessage}
            </h2>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {discardStayLabel}
              </button>
              <button
                type="button"
                onClick={handleLeave}
                className="rounded-xl border border-amber-200 bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
              >
                {discardLeaveLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
