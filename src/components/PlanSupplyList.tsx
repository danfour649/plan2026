"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useTranslations } from "@/components/TranslationsProvider";
import {
  createSupplyItem,
  deleteSupplyItem,
  updateSupplyItem,
  type SupplyActionResult,
} from "@/lib/actions/supplies";

type SupplyItemDisplay = {
  id: string;
  label: string;
  price: number | null;
  description: string | null;
  link: string | null;
  order: number;
};

type PlanSupplyListProps = {
  planId: string;
  items: SupplyItemDisplay[];
  isOwner: boolean;
};

function wrapCreate(planId: string): (prev: SupplyActionResult | null, formData: FormData) => Promise<SupplyActionResult> {
  return (_prev, formData) => createSupplyItem(planId, formData);
}

function wrapUpdate(planId: string, itemId: string): (prev: SupplyActionResult | null, formData: FormData) => Promise<SupplyActionResult> {
  return (_prev, formData) => updateSupplyItem(planId, itemId, formData);
}

export function PlanSupplyList({ planId, items: initialItems, isOwner }: PlanSupplyListProps) {
  const t = useTranslations();
  const router = useRouter();
  const [state, createAction] = useActionState(wrapCreate(planId), null as SupplyActionResult | null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (state && !state.success) toast.error(state.error);
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <div className="flex flex-col gap-4">
      {isOwner ? (
        <form action={createAction} className="flex flex-wrap items-end gap-2 border-b border-blue-100 pb-4">
          <div className="min-w-0 flex-1">
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
          <div className="w-24">
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
          <div className="min-w-0 flex-1 sm:max-w-[14rem]">
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
            className="shrink-0 rounded-xl border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {t.supplyList.addItem}
          </button>
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
                  {item.price != null && !Number.isNaN(item.price) ? (
                    <span className="ml-2 text-sm text-zinc-600">
                      {typeof item.price === "number" ? item.price.toFixed(2) : String(item.price)}
                    </span>
                  ) : null}
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
  const router = useRouter();
  const [state, formAction] = useActionState(wrapUpdate(planId, item.id), null as SupplyActionResult | null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onSuccess();
    }
    if (state && !state.success) toast.error(state.error);
  }, [state, router, onSuccess]);

  return (
    <li className="border-b border-blue-100 py-3">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`supply-label-${item.id}`} className="sr-only">
            {t.supplyList.labelPlaceholder}
          </label>
          <input
            id={`supply-label-${item.id}`}
            name="label"
            type="text"
            required
            defaultValue={item.label}
            placeholder={t.supplyList.labelPlaceholder}
            className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
        <div className="w-24">
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={item.price ?? ""}
            placeholder={t.supplyList.pricePlaceholder}
            className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
        <div className="min-w-0 flex-1 sm:max-w-[14rem]">
          <input
            name="link"
            type="url"
            defaultValue={item.link ?? ""}
            placeholder={t.supplyList.linkPlaceholder}
            className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-xl border border-blue-200 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t.common.saveChanges}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
        >
          {t.common.cancel}
        </button>
      </form>
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
