"use client";

import { signIn } from "next-auth/react";

import { AuthProviderButton } from "./AuthProviderButton";
import { GOOGLE_SIGN_IN_PARAMS } from "@/lib/google-oauth";

export function GoogleSignInButton({
  callbackUrl = "/tasks",
  disabled,
  label = "Continue with Google",
}: {
  callbackUrl?: string;
  disabled: boolean;
  /** Button label (translated by parent). */
  label?: string;
}) {
  return (
    <AuthProviderButton
      disabled={disabled}
      onClick={() => signIn("google", { callbackUrl }, GOOGLE_SIGN_IN_PARAMS)}
      label={label}
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M23.49 12.27c0-.83-.07-1.62-.2-2.39H12v4.52h6.46a5.52 5.52 0 0 1-2.39 3.62v3.01h3.87c2.26-2.09 3.55-5.17 3.55-8.78Z"
            fill="#4285F4"
          />
          <path
            d="M12 24c3.24 0 5.95-1.07 7.93-2.92l-3.87-3.01c-1.07.72-2.44 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.29v3.11A11.99 11.99 0 0 0 12 24Z"
            fill="#34A853"
          />
          <path
            d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.27V6.62H1.29A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.29 5.38l3.99-3.11Z"
            fill="#FBBC05"
          />
          <path
            d="M12 4.78c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.07 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.99 3.11c.94-2.84 3.59-4.95 6.72-4.95Z"
            fill="#EA4335"
          />
        </svg>
      }
    />
  );
}

