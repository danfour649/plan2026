"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  children: React.ReactNode;
  /** Shown when form is submitting (e.g. "Saving…"). If not set, children are shown. */
  pendingChildren?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

/**
 * Submit button that disables itself while the form action is pending (prevents double submit).
 * Must be rendered as a descendant of the form.
 */
export function FormSubmitButton({
  children,
  pendingChildren,
  className,
  disabled,
  "aria-label": ariaLabel,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled ?? pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={className}
      aria-busy={pending}
      aria-label={ariaLabel}
    >
      {pending && pendingChildren != null ? pendingChildren : children}
    </button>
  );
}
