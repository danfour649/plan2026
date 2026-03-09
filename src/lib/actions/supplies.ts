"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { getCurrentUserId } from "@/auth";
import {
  getNavCountsCacheTag,
  getPlanDetailCacheTag,
  getPlansCacheTag,
  getSuppliesCacheTag,
} from "@/lib/data-cache";
import { prisma } from "@/lib/prisma";

export type SupplyActionResult = { success: true } | { success: false; error: string };

async function canAccessPlan(userId: string, planId: string): Promise<boolean> {
  const plan = await prisma.plan.findFirst({
    where: {
      id: planId,
      OR: [
        { userId },
        { shares: { some: { sharedWithUserId: userId } } },
      ],
    },
    select: { id: true },
  });
  return Boolean(plan);
}

export async function createSupplyItem(
  planId: string,
  formData: FormData,
): Promise<SupplyActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (!(await canAccessPlan(userId, planId))) return { success: false, error: "Forbidden" };

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { success: false, error: "Label is required" };

  const priceRaw = formData.get("price");
  const price = priceRaw !== null && priceRaw !== "" ? Number(priceRaw) : null;
  const description = formData.get("description");
  const link = formData.get("link");
  const quantityRaw = formData.get("quantity");
  const quantityParsed = quantityRaw != null && quantityRaw !== "" ? parseInt(String(quantityRaw), 10) : 1;
  const quantity = Number.isNaN(quantityParsed) || quantityParsed < 1 ? 1 : Math.min(quantityParsed, 999_999);
  const acquiredStatusRaw = formData.get("acquiredStatus");
  const acquiredStatus = ["needed", "ordered", "pending", "purchased"].includes(String(acquiredStatusRaw))
    ? String(acquiredStatusRaw)
    : "needed";

  const maxOrder = await prisma.supplyItem
    .aggregate({
      where: { planId },
      _max: { order: true },
    })
    .then((r) => r._max.order ?? -1);

  await prisma.supplyItem.create({
    data: {
      planId,
      userId,
      label: label.slice(0, 500),
      price: price != null && !Number.isNaN(price) ? price : null,
      description: description != null && String(description).trim() !== "" ? String(description).trim().slice(0, 2000) : null,
      link: link != null && String(link).trim() !== "" ? String(link).trim().slice(0, 2000) : null,
      quantity,
      acquiredStatus,
      order: maxOrder + 1,
    },
  });

  revalidateTag(getSuppliesCacheTag(userId), "max");
  revalidateTag(getPlanDetailCacheTag(planId), "max");
  revalidateTag(getNavCountsCacheTag(userId), "max");
  revalidateTag(getPlansCacheTag(userId), "max");
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/supplies");
  return { success: true };
}

export async function updateSupplyItem(
  planId: string,
  itemId: string,
  formData: FormData,
): Promise<SupplyActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (!(await canAccessPlan(userId, planId))) return { success: false, error: "Forbidden" };

  const existing = await prisma.supplyItem.findFirst({
    where: { id: itemId, planId, userId },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Not found" };

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { success: false, error: "Label is required" };

  const priceRaw = formData.get("price");
  const price = priceRaw !== null && priceRaw !== "" ? Number(priceRaw) : null;
  const description = formData.get("description");
  const link = formData.get("link");
  const quantityRaw = formData.get("quantity");
  const quantityParsed = quantityRaw != null && quantityRaw !== "" ? parseInt(String(quantityRaw), 10) : 1;
  const quantity = Number.isNaN(quantityParsed) || quantityParsed < 1 ? 1 : Math.min(quantityParsed, 999_999);
  const acquiredStatusRaw = formData.get("acquiredStatus");
  const acquiredStatus = ["needed", "ordered", "pending", "purchased"].includes(String(acquiredStatusRaw))
    ? String(acquiredStatusRaw)
    : "needed";

  await prisma.supplyItem.update({
    where: { id: itemId },
    data: {
      label: label.slice(0, 500),
      price: price != null && !Number.isNaN(price) ? price : null,
      description: description != null && String(description).trim() !== "" ? String(description).trim().slice(0, 2000) : null,
      link: link != null && String(link).trim() !== "" ? String(link).trim().slice(0, 2000) : null,
      quantity,
      acquiredStatus,
    },
  });

  revalidateTag(getSuppliesCacheTag(userId), "max");
  revalidateTag(getPlanDetailCacheTag(planId), "max");
  revalidateTag(getNavCountsCacheTag(userId), "max");
  revalidateTag(getPlansCacheTag(userId), "max");
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/supplies");
  return { success: true };
}

export async function deleteSupplyItem(planId: string, itemId: string): Promise<SupplyActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (!(await canAccessPlan(userId, planId))) return { success: false, error: "Forbidden" };

  const existing = await prisma.supplyItem.findFirst({
    where: { id: itemId, planId, userId },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Not found" };

  await prisma.supplyItem.delete({ where: { id: itemId } });
  revalidateTag(getSuppliesCacheTag(userId), "max");
  revalidateTag(getPlanDetailCacheTag(planId), "max");
  revalidateTag(getNavCountsCacheTag(userId), "max");
  revalidateTag(getPlansCacheTag(userId), "max");
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/supplies");
  return { success: true };
}
