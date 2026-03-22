"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type NavCounts = {
  remainingTaskCount: number;
  activePlanCount: number;
  suppliesCount: number;
};

const STALE_MS = 30_000;
const NAV_COUNTS_REFRESH_EVENT = "nav-counts:refresh";

/** Dispatch from anywhere (e.g. after a server action) to trigger a re-fetch of nav counts. */
export function refreshNavCounts() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NAV_COUNTS_REFRESH_EVENT));
  }
}

export function useNavCounts(initial?: NavCounts) {
  const [counts, setCounts] = useState<NavCounts>(
    initial ?? { remainingTaskCount: 0, activePlanCount: 0, suppliesCount: 0 },
  );
  const lastFetchRef = useRef(0);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    const changed = pathnameRef.current !== pathname;
    pathnameRef.current = pathname;
    const stale = Date.now() - lastFetchRef.current > STALE_MS;
    if (changed && !stale) return;
    refreshNavCounts();
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const handler = async () => {
      try {
        const res = await fetch("/api/nav-counts");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as NavCounts;
        if (!cancelled) {
          setCounts(data);
          lastFetchRef.current = Date.now();
        }
      } catch {
        // silently ignore — counts will be stale until next successful fetch
      }
    };
    window.addEventListener(NAV_COUNTS_REFRESH_EVENT, handler);
    handler();
    return () => {
      cancelled = true;
      window.removeEventListener(NAV_COUNTS_REFRESH_EVENT, handler);
    };
  }, []);

  return counts;
}
