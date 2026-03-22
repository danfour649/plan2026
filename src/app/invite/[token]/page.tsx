import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { Plan2026Logo } from "@/components/Plan2026Logo";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await getServerAuthSession();
  const { token } = await params;

  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);

  const invite = await prisma.planInvite.findUnique({
    where: { token },
    include: { plan: { select: { id: true, name: true } } },
  });

  if (!invite || invite.expiresAt < new Date()) {
    return (
      <main className="min-h-screen px-6 py-16 text-zinc-950">
        <div className="mx-auto max-w-md rounded-2xl border border-blue-100 bg-white/90 p-8 shadow-sm backdrop-blur">
          <Plan2026Logo className="mb-6" iconClassName="h-16 w-20" ariaLabel={t.common.goToPlans} />
          <h1 className="text-xl font-semibold text-blue-950">{t.invite.invalidTitle}</h1>
          <p className="mt-2 text-sm text-zinc-600">{t.invite.invalidDescription}</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t.invite.signIn}
          </Link>
        </div>
      </main>
    );
  }

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  try {
    await prisma.planShare.upsert({
      where: {
        planId_sharedWithUserId: {
          planId: invite.planId,
          sharedWithUserId: session.user.id,
        },
      },
      create: {
        planId: invite.planId,
        sharedWithUserId: session.user.id,
      },
      update: {},
    });
    await prisma.planInvite.delete({ where: { id: invite.id } });
  } catch {
    // already shared or race
  }

  redirect(`/plans/${invite.plan.id}`);
}
