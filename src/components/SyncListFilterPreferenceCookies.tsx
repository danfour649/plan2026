"use client";

import { useEffect } from "react";

import {
  persistPlansShowArchived,
  persistTasksShowCompleted,
} from "@/lib/actions/list-filter-preferences";

/** Keeps list-filter cookies aligned with the resolved URL + cookie state after navigation. */
export function SyncTasksListFilterCookie({ showCompleted }: { showCompleted: boolean }) {
  useEffect(() => {
    void persistTasksShowCompleted(showCompleted);
  }, [showCompleted]);
  return null;
}

export function SyncPlansListFilterCookie({ showArchived }: { showArchived: boolean }) {
  useEffect(() => {
    void persistPlansShowArchived(showArchived);
  }, [showArchived]);
  return null;
}
