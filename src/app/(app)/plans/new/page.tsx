import { cookies } from "next/headers";

import { getCurrentUserId } from "@/auth";
import { NewPlanSection } from "@/components/NewPlanSection";
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
    <NewPlanSection
      action={createPlan}
      userTasks={userTasks}
      cancelLabel={t.plansPage.cancelNewPlan}
      confirmMessage={t.plansPage.discardNewPlanConfirm}
      discardLeaveLabel={t.plansPage.discardLeave}
      discardStayLabel={t.plansPage.discardStay}
      newPlanTitle={t.plansPage.newPlan}
      newPlanDescription={t.plansPage.newPlanDescription}
      createPlanLabel={t.common.createPlan}
    />
  );
}
