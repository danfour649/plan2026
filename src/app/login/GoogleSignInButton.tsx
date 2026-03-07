"use client";

import { signIn } from "next-auth/react";

import { GOOGLE_AUTHORIZATION_PARAMS } from "@/lib/google-oauth";

export function GoogleSignInButton({
  callbackUrl = "/tasks",
  disabled,
}: {
  callbackUrl?: string;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        signIn("google", { callbackUrl }, GOOGLE_AUTHORIZATION_PARAMS)
      }
      className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
    >
      Continue with Google
    </button>
  );
}

