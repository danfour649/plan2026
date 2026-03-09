"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { SupplyItemForm } from "@/components/SupplyItemForm";
import { useTranslations } from "@/components/TranslationsProvider";
import {
  createSupplyItem,
  deleteSupplyItem,
  updateSupplyItem,
  type SupplyActionResult,
} from "@/lib/actions/supplies";

function getStatusLabel(
  t: ReturnType<typeof useTranslations>,
  status: string,
): string {
  switch (status) {
    case "ordered":
      return t.supplyList.statusOrdered;
    case "pending":
      return t.supplyList.statusPending;
    case "purchased":
      return t.supplyList.statusPurchased;
    default:
      return t.supplyList.statusNeeded;
  }
}

type SupplyItemDisplay = {
  id: string;
  label: string;
  price: number | null;
  description: string | null;
  link: string | null;
  quantity: number;
  acquiredStatus: string;
  order: number;
};

type PlanSupplyListProps = {
  planId: string;
  items: SupplyItemDisplay[];
  isOwner: boolean;
  /** When set (e.g. from Supplies page link), open this item in edit mode on mount. */
  initialEditingItemId?: string;
};

function wrapCreate(planId: string): (prev: SupplyActionResult | null, formData: FormData) => Promise<SupplyActionResult> {
  return (_prev, formData) => createSupplyItem(planId, formData);
}

function wrapUpdate(planId: string, itemId: string): (prev: SupplyActionResult | null, formData: FormData) => Promise<SupplyActionResult> {
  return (_prev, formData) => updateSupplyItem(planId, itemId, formData);
}

export function PlanSupplyList({ planId, items: initialItems, isOwner, initialEditingItemId }: PlanSupplyListProps) {
  const t = useTranslations();
  const router = useRouter();
  const [state, createAction] = useActionState(wrapCreate(planId), null as SupplyActionResult | null);
  const [editingId, setEditingId] = useState<string | null>(initialEditingItemId ?? null);

  useEffect(() => {
    if (state && !state.success) toast.error(state.error);
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <div className="flex flex-col gap-4">
      {isOwner ? (
        <form action={createAction} className="flex flex-col gap-3 border-b border-blue-100 pb-4">
          <div className="w-full min-w-0 sm:flex-1 sm:min-w-[10rem]">
            <label htmlFor="supply-label-new" className="sr-only">
              {t.supplyList.labelPlaceholder}
            </label>
            <input
              id="supply-label-new"
              name="label"
              type="text"
              required
              placeholder={t.supplyList.labelPlaceholder}
              className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
            />
          </div>
          <div className="w-full min-w-0">
            <label htmlFor="supply-desc-new" className="sr-only">
              {t.supplyList.descriptionPlaceholder}
            </label>
            <input
              id="supply-desc-new"
              name="description"
              type="text"
              placeholder={t.supplyList.descriptionPlaceholder}
              className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2">
            <div className="w-full min-w-0 sm:w-24">
              <label htmlFor="supply-price-new" className="sr-only">
                {t.supplyList.pricePlaceholder}
              </label>
              <input
                id="supply-price-new"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder={t.supplyList.pricePlaceholder}
                className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
              />
            </div>
            <div className="w-full min-w-0 sm:w-20">
              <label htmlFor="supply-qty-new" className="sr-only">
                {t.supplyList.quantityPlaceholder}
              </label>
              <input
                id="supply-qty-new"
                name="quantity"
                type="number"
                min="1"
                max="999999"
                defaultValue={1}
                placeholder={t.supplyList.quantityPlaceholder}
                className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
              />
            </div>
            <div className="w-full sm:w-32">
              <label htmlFor="supply-status-new" className="sr-only">
                {t.supplyList.statusLabel}
              </label>
              <select
                id="supply-status-new"
                name="acquiredStatus"
                className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
              >
                <option value="needed">{t.supplyList.statusNeeded}</option>
                <option value="ordered">{t.supplyList.statusOrdered}</option>
                <option value="pending">{t.supplyList.statusPending}</option>
                <option value="purchased">{t.supplyList.statusPurchased}</option>
              </select>
            </div>
            <div className="w-full min-w-0 sm:flex-1 sm:min-w-[10rem] sm:max-w-[14rem]">
              <label htmlFor="supply-link-new" className="sr-only">
                {t.supplyList.linkPlaceholder}
              </label>
              <input
                id="supply-link-new"
                name="link"
                type="url"
                placeholder={t.supplyList.linkPlaceholder}
                className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto sm:shrink-0"
            >
              {t.supplyList.addItem}
            </button>
          </div>
        </form>
      ) : null}

      {initialItems.length > 0 ? (
        <ul className="divide-y divide-blue-100">
          {initialItems.map((item) =>
            editingId === item.id && isOwner ? (
              <SupplyItemEditRow
                key={item.id}
                item={item}
                planId={planId}
                onCancel={() => setEditingId(null)}
                onSuccess={() => setEditingId(null)}
              />
            ) : (
              <li
                key={item.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-blue-950">{item.label}</span>
                  {item.quantity > 1 ? (
                    <span className="ml-2 text-sm text-zinc-500">× {item.quantity}</span>
                  ) : null}
                  {item.price != null && !Number.isNaN(item.price) ? (
                    <span className="ml-2 text-sm text-zinc-600">
                      {typeof item.price === "number" ? item.price.toFixed(2) : String(item.price)}
                    </span>
                  ) : null}
                  <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {getStatusLabel(t, item.acquiredStatus)}
                  </span>
                  {item.description ? (
                    <p className="mt-0.5 text-sm text-zinc-500">{item.description}</p>
                  ) : null}
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block truncate text-sm text-blue-600 underline hover:text-blue-800"
                    >
                      {item.link}
                    </a>
                  ) : null}
                </div>
                {isOwner ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                    >
                      {t.common.edit}
                    </button>
                    <DeleteSupplyItemButton planId={planId} itemId={item.id} />
                  </div>
                ) : null}
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="py-4 text-sm text-zinc-500">{t.supplyList.noItems}</p>
      )}
    </div>
  );
}

function SupplyItemEditRow({
  item,
  planId,
  onCancel,
  onSuccess,
}: {
  item: SupplyItemDisplay;
  planId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations();
  return (
    <li className="border-b border-blue-100 py-3">
      <SupplyItemForm
        idPrefix={`supply-${item.id}`}
        initialValues={{
          label: item.label,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          acquiredStatus: item.acquiredStatus,
          link: item.link,
        }}
        formAction={wrapUpdate(planId, item.id)}
        onSuccess={onSuccess}
        submitLabel={t.common.saveChanges}
        showCancel
        onCancel={onCancel}
      />
    </li>
  );
}

function DeleteSupplyItemButton({ planId, itemId }: { planId: string; itemId: string }) {
  const t = useTranslations();

  async function handleDelete() {
    if (!confirm(t.supplyList.deleteItem + "?")) return;
    const result = await deleteSupplyItem(planId, itemId);
    if (result.success) {
      toast.success(t.supplyList.deleteItem);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100"
    >
      {t.common.delete}
    </button>
  );
}
