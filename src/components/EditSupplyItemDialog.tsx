"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { SupplyItemForm, type SupplyItemFormValues } from "@/components/SupplyItemForm";
import { useTranslations } from "@/components/TranslationsProvider";
import { deleteSupplyItem, updateSupplyItem, type SupplyActionResult } from "@/lib/actions/supplies";

export type SupplyItemForEdit = {
  id: string;
  planId: string;
  planName?: string;
} & SupplyItemFormValues;

type EditSupplyItemDialogProps = {
  item: SupplyItemForEdit;
  children?: React.ReactNode;
  triggerClassName?: string;
  showButton?: boolean;
};

function wrapUpdate(
  planId: string,
  itemId: string,
): (prev: SupplyActionResult | null, formData: FormData) => Promise<SupplyActionResult> {
  return (_prev, formData) => updateSupplyItem(planId, itemId, formData);
}

function wrapDelete(
  planId: string,
  itemId: string,
): (prev: SupplyActionResult | null, _formData: FormData) => Promise<SupplyActionResult> {
  return () => deleteSupplyItem(planId, itemId);
}

function isInteractiveTarget(target: EventTarget | null, currentTarget: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const interactiveAncestor = target.closest(
    "a, button, input, textarea, select, label, [role='button']",
  );
  return interactiveAncestor !== null && interactiveAncestor !== currentTarget;
}

export function EditSupplyItemDialog({
  item,
  children,
  triggerClassName,
  showButton = true,
}: EditSupplyItemDialogProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        overlayRef.current?.scrollTo({ top: 0, behavior: "auto" });
      });
    }
  }, [isOpen]);

  const [deleteState, deleteFormAction] = useActionState(
    wrapDelete(item.planId, item.id),
    null as SupplyActionResult | null,
  );

  useEffect(() => {
    if (!deleteState) return;
    if (deleteState.success) {
      toast.success(t.supplyList.deleteItem);
      queueMicrotask(() => {
        if (isMountedRef.current) setIsOpen(false);
      });
    } else if (deleteState.error) {
      toast.error(deleteState.error);
    }
  }, [deleteState, t.supplyList.deleteItem]);

  const initialValues: SupplyItemFormValues = {
    label: item.label,
    description: item.description,
    price: item.price,
    quantity: item.quantity,
    acquiredStatus: item.acquiredStatus,
    link: item.link,
  };

  return (
    <>
      {children ? (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            if (!isInteractiveTarget(e.target, e.currentTarget)) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          className={triggerClassName}
        >
          {children}
        </div>
      ) : null}

      {showButton ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 sm:px-3 sm:py-1.5 sm:text-sm"
        >
          {t.common.edit}
        </button>
      ) : null}

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-zinc-950/45 px-4 pt-6 pb-8 sm:pt-8"
            onClick={() => setIsOpen(false)}
            role="presentation"
          >
            <div
              className="w-full max-w-2xl shrink-0 rounded-3xl border border-blue-100 bg-white px-6 pb-6 pt-4 shadow-2xl shadow-blue-950/10"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`edit-supply-item-dialog-title-${item.id}`}
            >
              <div className="mb-1 flex items-start justify-between gap-4">
                <div>
                  <h2
                    id={`edit-supply-item-dialog-title-${item.id}`}
                    className="text-xl font-semibold tracking-tight text-blue-950"
                  >
                    {t.supplyList.editItem}
                  </h2>
                  {item.planName ? (
                    <p className="mt-0.5 text-sm text-zinc-500">{item.planName}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                  aria-label={t.supplyList.closeEditItemDialog}
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M5 5L15 15M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-4">
                <SupplyItemForm
                  idPrefix={`supply-${item.id}`}
                  initialValues={initialValues}
                  formAction={wrapUpdate(item.planId, item.id)}
                  onSuccess={() => setIsOpen(false)}
                  submitLabel={t.common.saveChanges}
                />
              </div>

              <div className="mt-6 border-t border-blue-100 pt-4">
                <form action={deleteFormAction} className="flex flex-col gap-3">
                  {!showDeleteConfirm ? (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-zinc-500">{t.supplyList.deleteItemConfirm}</p>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-zinc-600">{t.supplyList.deleteItemConfirm}</p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type="submit"
                          className="rounded-xl border border-red-200 bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                        >
                          {t.common.delete}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
