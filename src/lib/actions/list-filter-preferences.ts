"use server";

import { cookies } from "next/headers";

import {
  PLANS_SHOW_ARCHIVED_COOKIE,
  TASKS_SHOW_COMPLETED_COOKIE,
} from "@/lib/list-filter-preferences";

const COOKIE_BASE = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

export async function persistTasksShowCompleted(showCompleted: boolean) {
  (await cookies()).set(
    TASKS_SHOW_COMPLETED_COOKIE,
    showCompleted ? "1" : "0",
    COOKIE_BASE,
  );
}

export async function persistPlansShowArchived(showArchived: boolean) {
  (await cookies()).set(
    PLANS_SHOW_ARCHIVED_COOKIE,
    showArchived ? "1" : "0",
    COOKIE_BASE,
  );
}
