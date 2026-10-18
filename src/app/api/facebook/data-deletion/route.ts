import { NextResponse } from "next/server";

import {
  generateDeletionConfirmationCode,
  parseFacebookSignedRequest,
} from "@/lib/facebook-data-deletion";
import { prisma } from "@/lib/prisma";
import { absoluteCanonicalUrl } from "@/lib/site-url";

/**
 * Meta Data Deletion Callback.
 * Configure in the Meta App Dashboard (Settings → Basic → User data deletion)
 * as: https://plan2026.ca/api/facebook/data-deletion
 *
 * Meta POSTs a form-encoded `signed_request`. We verify it with
 * AUTH_FACEBOOK_SECRET, delete the matching data (the Facebook Account row,
 * or the whole User when Facebook is their only sign-in provider — mirroring
 * full account deletion in the privacy policy), record the request so the
 * user can check status, and return the { url, confirmation_code } pair
 * Meta expects.
 */
export async function POST(request: Request) {
  const appSecret = process.env.AUTH_FACEBOOK_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "Facebook login is not configured" }, { status: 500 });
  }

  const formData = await request.formData().catch(() => null);
  const signedRequest = formData?.get("signed_request");
  const payload =
    typeof signedRequest === "string" ? parseFacebookSignedRequest(signedRequest, appSecret) : null;
  const facebookUserId = payload?.user_id;
  if (!facebookUserId) {
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
  }

  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: { provider: "facebook", providerAccountId: facebookUserId },
    },
    include: { user: { include: { accounts: { select: { id: true } } } } },
  });

  let status: "completed" | "no_account_found" = "no_account_found";
  if (account) {
    if (account.user.accounts.length > 1) {
      // Other sign-in methods remain: remove only the Facebook link.
      await prisma.account.delete({ where: { id: account.id } });
    } else {
      // Facebook is the only provider: delete the user. Account, Session,
      // Task, Plan and related rows cascade (see prisma/schema.prisma).
      await prisma.user.delete({ where: { id: account.userId } });
    }
    status = "completed";
  }

  const confirmationCode = generateDeletionConfirmationCode();
  await prisma.dataDeletionRequest.create({
    data: {
      confirmationCode,
      provider: "facebook",
      providerAccountId: facebookUserId,
      status,
    },
  });

  return NextResponse.json({
    url: absoluteCanonicalUrl(`/privacy/deletion-status?code=${confirmationCode}`),
    confirmation_code: confirmationCode,
  });
}
