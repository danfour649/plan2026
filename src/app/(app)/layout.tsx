import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { AppNavLink } from "@/components/AppNavLink";
import { SignOutButton } from "@/components/SignOutButton";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");
  const remainingTaskCount = await prisma.task.count({
    where: { userId: session.user.id, completedAt: null },
  });

  return (
    <div className="min-h-screen bg-transparent text-zinc-950">
      <header className="border-b border-blue-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <nav className="flex items-center gap-4 text-sm text-zinc-700">
              <AppNavLink href="/dashboard" accent="blue" badge={remainingTaskCount}>
                Tasks
              </AppNavLink>
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

