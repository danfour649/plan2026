"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/auth";
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
      order: maxOrder + 1,
    },
  });

  revalidatePath(`/plans/${planId}`);
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

  await prisma.supplyItem.update({
    where: { id: itemId },
    data: {
      label: label.slice(0, 500),
      price: price != null && !Number.isNaN(price) ? price : null,
      description: description != null && String(description).trim() !== "" ? String(description).trim().slice(0, 2000) : null,
      link: link != null && String(link).trim() !== "" ? String(link).trim().slice(0, 2000) : null,
    },
  });

  revalidatePath(`/plans/${planId}`);
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
  revalidatePath(`/plans/${planId}`);
  return { success: true };
}
