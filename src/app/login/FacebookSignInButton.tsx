"use client";

import { signIn } from "next-auth/react";

import { AuthProviderButton } from "./AuthProviderButton";

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
    <AuthProviderButton
      disabled={disabled}
      onClick={() => signIn("facebook", { callbackUrl })}
      label={label}
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="#1877F2"
            d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.11 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.04 1.8-4.72 4.56-4.72 1.32 0 2.7.24 2.7.24v2.98h-1.52c-1.5 0-1.97.94-1.97 1.9v2.27h3.35l-.54 3.49h-2.81V24C19.61 23.11 24 18.1 24 12.07Z"
          />
          <path
            fill="#fff"
            d="M16.65 15.56l.54-3.49h-3.35V9.8c0-.96.47-1.9 1.97-1.9h1.52V4.93S16.01 4.7 14.69 4.7c-2.76 0-4.56 1.68-4.56 4.72v2.65H7.08v3.49h3.05V24c.61.1 1.24.16 1.87.16.63 0 1.26-.06 1.87-.16v-8.44h2.78Z"
          />
        </svg>
      }
    />
  );
}
