import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUserIdForListPrefs } from "@/auth";
import {
  LIST_PREF_COOKIE_OPTIONS,
  PLANS_SHOW_ARCHIVED_COOKIE,
  TASKS_SHOW_COMPLETED_COOKIE,
} from "@/lib/list-filter-preferences";

type Body = {
  tasksShowCompleted?: boolean;
  plansShowArchived?: boolean;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const hasUpdate =
    typeof body.tasksShowCompleted === "boolean" ||
    typeof body.plansShowArchived === "boolean";
  if (!hasUpdate) {
    return NextResponse.json({ error: "No preferences to update" }, { status: 400 });
  }

  if ((await getCurrentUserIdForListPrefs()) == null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jar = await cookies();

  if (typeof body.tasksShowCompleted === "boolean") {
    jar.set(
      TASKS_SHOW_COMPLETED_COOKIE,
      body.tasksShowCompleted ? "1" : "0",
      LIST_PREF_COOKIE_OPTIONS,
    );
  }
  if (typeof body.plansShowArchived === "boolean") {
    jar.set(
      PLANS_SHOW_ARCHIVED_COOKIE,
      body.plansShowArchived ? "1" : "0",
      LIST_PREF_COOKIE_OPTIONS,
    );
  }

  return NextResponse.json({ ok: true });
}
