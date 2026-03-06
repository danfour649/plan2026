import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { GoogleSignInButton } from "./GoogleSignInButton";

export default async function LoginPage() {
  const session = await getServerAuthSession();
  if (session?.user) redirect("/dashboard");

  const hasGoogleCredentials = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-950">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Use your Google account to access your tasks dashboard.
        </p>

        {!hasGoogleCredentials ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Set <span className="font-medium">GOOGLE_CLIENT_ID</span> and{" "}
            <span className="font-medium">GOOGLE_CLIENT_SECRET</span> in your{" "}
            <span className="font-medium">.env</span> to enable Google sign-in.
          </div>
        ) : null}

        <div className="mt-8">
          <GoogleSignInButton disabled={!hasGoogleCredentials} />
        </div>
      </div>
    </main>
  );
}

