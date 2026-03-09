/**
 * Module-level dirty flag for the edit-plan form. Set when user edits; read when
 * "Back to plans" or Cancel is clicked so we can show the discard confirm dialog.
 */
let editPlanFormDirty = false;

export function setEditPlanFormDirty(): void {
  editPlanFormDirty = true;
}

export function getEditPlanFormDirty(): boolean {
  return editPlanFormDirty;
}

export function clearEditPlanFormDirty(): void {
  editPlanFormDirty = false;
}
