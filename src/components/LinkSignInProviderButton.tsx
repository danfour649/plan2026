"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

import { GOOGLE_SIGN_IN_PARAMS } from "@/lib/google-oauth";

type SignInProvider = "google" | "facebook";

export function LinkSignInProviderButton({
  provider,
  label,
  linkingLabel,
}: {
  provider: SignInProvider;
  label: string;
  linkingLabel: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const callbackUrl = "/settings";
          if (provider === "google") {
            await signIn("google", { callbackUrl }, GOOGLE_SIGN_IN_PARAMS);
          } else {
            await signIn("facebook", { callbackUrl });
          }
        } finally {
          setPending(false);
        }
      }}
      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
    >
      {pending ? linkingLabel : label}
    </button>
  );
}
