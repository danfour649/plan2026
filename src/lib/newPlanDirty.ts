/**
 * Module-level dirty flag for the new-plan form so it survives React Strict Mode
 * double-mount in development. Set when user edits; read when cancel is clicked.
 */
let newPlanFormDirty = false;

export function setNewPlanFormDirty(): void {
  newPlanFormDirty = true;
}

export function getNewPlanFormDirty(): boolean {
  return newPlanFormDirty;
}

export function clearNewPlanFormDirty(): void {
  newPlanFormDirty = false;
}
