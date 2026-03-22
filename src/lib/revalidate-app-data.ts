import { revalidateTag } from "next/cache";

import {
  getNavCountsCacheTag,
  getPlanDetailCacheTag,
  getPlansCacheTag,
  getSuppliesCacheTag,
  getTasksCacheTag,
} from "@/lib/data-cache";
import * as memo from "@/lib/runtime-rsc-memo";

export function revalidateNavCounts(userId: string) {
  memo.memoNavClear(userId);
  revalidateTag(getNavCountsCacheTag(userId), "max");
}

export function revalidateTasksCaches(userId: string) {
  memo.memoTasksPageClearForUser(userId);
  memo.memoActionsPageClearForUser(userId);
  revalidateTag(getTasksCacheTag(userId), "max");
}

export function revalidatePlansCaches(userId: string) {
  memo.memoPlansPageClearForUser(userId);
  memo.memoPlanListClear(userId);
  revalidateTag(getPlansCacheTag(userId), "max");
}

export function revalidatePlanDetail(planId: string) {
  revalidateTag(getPlanDetailCacheTag(planId), "max");
}

export function revalidateSuppliesCaches(userId: string) {
  memo.memoSuppliesPageClear(userId);
  revalidateTag(getSuppliesCacheTag(userId), "max");
}
