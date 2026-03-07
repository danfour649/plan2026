import { cookies } from "next/headers";

import { getCurrentUserId } from "@/auth";
import { PlanForm } from "@/components/PlanForm";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { createPlan } from "@/lib/actions/plans";

export default async function NewPlanPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);
  const userTasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">{t.plansPage.newPlan}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t.plansPage.newPlanDescription}</p>
      </div>
      <section className="rounded-2xl border border-blue-100 bg-white/90 px-6 py-6 shadow-sm shadow-blue-100/40 backdrop-blur">
        <PlanForm
          action={createPlan}
          userTasks={userTasks}
          isEdit={false}
          submitLabel={t.common.createPlan}
        />
      </section>
    </div>
  );
}
