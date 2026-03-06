"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
    >
      Continue with Google
    </button>
  );
}

