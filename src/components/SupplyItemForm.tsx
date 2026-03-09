"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useTranslations } from "@/components/TranslationsProvider";
import type { SupplyActionResult } from "@/lib/actions/supplies";

export type SupplyItemFormValues = {
  label: string;
  description: string | null;
  price: number | null;
  quantity: number;
  acquiredStatus: string;
  link: string | null;
};

type SupplyItemFormProps = {
  idPrefix: string;
  initialValues: SupplyItemFormValues;
  formAction: (prev: SupplyActionResult | null, formData: FormData) => Promise<SupplyActionResult>;
  onSuccess?: () => void;
  submitLabel: string;
  showCancel?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
};

const inputClass =
  "w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4 placeholder:text-zinc-400";

export function SupplyItemForm({
  idPrefix,
  initialValues,
  formAction,
  onSuccess,
  submitLabel,
  showCancel = false,
  onCancel,
  cancelLabel,
}: SupplyItemFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [state, action] = useActionState(formAction, null as SupplyActionResult | null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onSuccess?.();
    }
    if (state && !state.success) toast.error(state.error);
  }, [state, router, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="min-w-0">
        <label htmlFor={`${idPrefix}-label`} className="sr-only">
          {t.supplyList.labelPlaceholder}
        </label>
        <input
          id={`${idPrefix}-label`}
          name="label"
          type="text"
          required
          defaultValue={initialValues.label}
          placeholder={t.supplyList.labelPlaceholder}
          className={inputClass}
        />
      </div>
      <div className="min-w-0">
        <input
          name="description"
          type="text"
          defaultValue={initialValues.description ?? ""}
          placeholder={t.supplyList.descriptionPlaceholder}
          className={inputClass}
        />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-24">
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialValues.price ?? ""}
            placeholder={t.supplyList.pricePlaceholder}
            className={inputClass}
          />
        </div>
        <div className="w-20">
          <label htmlFor={`${idPrefix}-qty`} className="sr-only">
            {t.supplyList.quantityPlaceholder}
          </label>
          <input
            id={`${idPrefix}-qty`}
            name="quantity"
            type="number"
            min="1"
            max="999999"
            defaultValue={initialValues.quantity}
            placeholder={t.supplyList.quantityPlaceholder}
            className={inputClass}
          />
        </div>
        <div className="w-32">
          <label htmlFor={`${idPrefix}-status`} className="sr-only">
            {t.supplyList.statusLabel}
          </label>
          <select
            id={`${idPrefix}-status`}
            name="acquiredStatus"
            defaultValue={initialValues.acquiredStatus}
            className={inputClass}
          >
            <option value="needed">{t.supplyList.statusNeeded}</option>
            <option value="ordered">{t.supplyList.statusOrdered}</option>
            <option value="pending">{t.supplyList.statusPending}</option>
            <option value="purchased">{t.supplyList.statusPurchased}</option>
          </select>
        </div>
        <div className="min-w-0 flex-1 sm:max-w-[14rem]">
          <input
            name="link"
            type="url"
            defaultValue={initialValues.link ?? ""}
            placeholder={t.supplyList.linkPlaceholder}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-xl border border-blue-200 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {submitLabel}
        </button>
        {showCancel && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
          >
            {cancelLabel ?? t.common.cancel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
