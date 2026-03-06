"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100"
    >
      Sign out
    </button>
  );
}

