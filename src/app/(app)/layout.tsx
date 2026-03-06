import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-semibold">
              Tasks
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-700">
              <Link href="/dashboard" className="hover:text-zinc-950">
                Dashboard
              </Link>
              <Link href="/completed" className="hover:text-zinc-950">
                Completed
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-600 sm:inline">
              {session?.user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}

