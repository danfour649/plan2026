import { getCurrentUserId } from "@/auth";
import { NewPlanSection } from "@/components/NewPlanSection";
import {
  PLAN_TEMPLATE_DEFINITIONS,
  resolvePlanTemplates,
} from "@/data/planTemplates";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { createPlan } from "@/lib/actions/plans";

export default async function NewPlanPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  const templates = resolvePlanTemplates(PLAN_TEMPLATE_DEFINITIONS, t);

  return (
    <NewPlanSection
      action={createPlan}
      templates={templates}
      templateSelectLabel={t.templates.startFrom}
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
