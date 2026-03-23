"use client";

import { AppNavLink } from "@/components/AppNavLink";
import { CheckboxIcon, CurrencyIcon, LightbulbIcon } from "@/components/NavIcons";
import { useNavCounts } from "@/components/NavCountsBadges";
import type { NavCounts } from "@/lib/data-cache";

type AppNavBarProps = {
  initialCounts: NavCounts;
  labels: {
    plans: string;
    tasks: string;
    supplies: string;
  };
};

export function AppNavBar({ initialCounts, labels }: AppNavBarProps) {
  const { remainingTaskCount, activePlanCount, suppliesCount } = useNavCounts(initialCounts);

  return (
    <nav className="flex min-w-0 shrink items-center gap-0 text-sm text-secondary sm:gap-4">
      <div className="flex min-w-0 shrink items-center gap-0 sm:gap-2 md:gap-3">
        <AppNavLink
          href="/plans"
          accent="blue"
          badge={activePlanCount}
          ariaLabel={labels.plans}
          prefetch={false}
          className="-mx-1 shrink-0 gap-0 rounded-full px-0.5 py-0.5 text-[11px] sm:mx-0 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm md:text-base"
        >
          <span className="inline-flex mt-0.5 sm:mt-0 sm:hidden">
            <LightbulbIcon className="h-8 w-8" />
          </span>
          <span className="hidden sm:inline">{labels.plans}</span>
        </AppNavLink>
        <div className="flex min-w-0 shrink items-center gap-0 sm:gap-1 md:gap-1.5">
          <AppNavLink
            href="/tasks"
            accent="blue"
            badge={remainingTaskCount}
            ariaLabel={labels.tasks}
            prefetch={false}
            className="-mx-1 shrink-0 gap-0 rounded-full px-0.5 py-0.5 text-[11px] sm:mx-0 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm md:text-base"
          >
            <span className="inline-flex mt-0.5 sm:mt-0 sm:hidden">
              <CheckboxIcon className="h-8 w-8" />
            </span>
            <span className="hidden sm:inline">{labels.tasks}</span>
          </AppNavLink>
          <AppNavLink
            href="/supplies"
            accent="blue"
            badge={suppliesCount > 0 ? suppliesCount : undefined}
            ariaLabel={labels.supplies}
            prefetch={false}
            className="-mx-1 shrink-0 gap-0 rounded-full px-0.5 py-0.5 text-[11px] sm:ml-0 sm:mx-0 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm md:text-base"
          >
            <span className="inline-flex mt-0.5 sm:mt-0 sm:hidden">
              <CurrencyIcon className="h-8 w-8" />
            </span>
            <span className="hidden sm:inline">{labels.supplies}</span>
          </AppNavLink>
        </div>
      </div>
    </nav>
  );
}
