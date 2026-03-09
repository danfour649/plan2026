"use client";

import { signIn } from "next-auth/react";

export function FacebookSignInButton({
  callbackUrl = "/tasks",
  disabled,
  label = "Continue with Facebook",
}: {
  callbackUrl?: string;
  disabled: boolean;
  /** Button label (translated by parent). */
  label?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => signIn("facebook", { callbackUrl })}
      className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-[#1877f2] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
    >
      {label}
    </button>
  );
}
