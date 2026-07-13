"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/auth";
import { generateApiToken } from "@/lib/api-auth-utils";
import { prisma } from "@/lib/prisma";
import { userHasProEntitlement } from "@/lib/revenuecat-server";
import {
  apiTokenIdSchema,
  createApiTokenSchema,
  MAX_API_TOKENS_PER_USER,
} from "@/lib/validations/api-token";

const API_TOKEN_PRO_REQUIRED_ERROR =
  "Pro subscription required to create API tokens. Upgrade at /upgrade.";

export type CreateApiTokenResult =
  | { success: true; token: string; tokenPrefix: string; name: string }
  | { success: false; error: string };

export type RevokeApiTokenResult = { success: true } | { success: false; error: string };

export async function createApiToken(formData: FormData): Promise<CreateApiTokenResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  if (!(await userHasProEntitlement(userId))) {
    return { success: false, error: API_TOKEN_PRO_REQUIRED_ERROR };
  }

  const parsed = createApiTokenSchema.safeParse({ name: formData.get("name") ?? "" });
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input";
    return { success: false, error: msg };
  }

  const existingCount = await prisma.apiToken.count({ where: { userId } });
  if (existingCount >= MAX_API_TOKENS_PER_USER) {
    return {
      success: false,
      error: `You can have at most ${MAX_API_TOKENS_PER_USER} API tokens. Revoke one first.`,
    };
  }

  const { rawToken, tokenHash, tokenPrefix } = generateApiToken();

  await prisma.apiToken.create({
    data: {
      userId,
      name: parsed.data.name,
      tokenHash,
      tokenPrefix,
    },
  });

  revalidatePath("/settings");
  return { success: true, token: rawToken, tokenPrefix, name: parsed.data.name };
}

export async function revokeApiToken(formData: FormData): Promise<RevokeApiTokenResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = apiTokenIdSchema.safeParse({ tokenId: formData.get("tokenId") ?? "" });
  if (!parsed.success) {
    return { success: false, error: "Invalid token ID" };
  }

  // deleteMany scoped by userId so a user can only revoke their own tokens.
  const { count } = await prisma.apiToken.deleteMany({
    where: { id: parsed.data.tokenId, userId },
  });

  if (count === 0) {
    return { success: false, error: "Token not found" };
  }

  revalidatePath("/settings");
  return { success: true };
}
