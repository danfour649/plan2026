/** Lets the plan edit header call the same back / discard logic as EditPlanFormWrapper. */
let backHandler: (() => void) | null = null;

export function registerPlanEditBackHandler(fn: (() => void) | null): void {
  backHandler = fn;
}

/** @returns true if a registered handler ran (e.g. opens discard modal or navigates). */
export function requestPlanEditBack(): boolean {
  if (!backHandler) return false;
  backHandler();
  return true;
}
