import { z } from "zod";

/** Max length for a personal API token name. */
export const API_TOKEN_NAME_MAX_LENGTH = 100;

/** Max personal API tokens per user (keeps the Settings list and abuse surface small). */
export const MAX_API_TOKENS_PER_USER = 10;

/** CUID format used by Prisma @default(cuid()) - 25 chars, 'c' prefix, base36. */
const CUID_REGEX = /^c[a-z0-9]{24}$/;

export const createApiTokenSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, "Token name is required")
    .refine(
      (s) => s.length <= API_TOKEN_NAME_MAX_LENGTH,
      `Token name must be at most ${API_TOKEN_NAME_MAX_LENGTH} characters`,
    ),
});

export const apiTokenIdSchema = z.object({
  tokenId: z
    .string()
    .min(1, "Token ID is required")
    .refine((s) => CUID_REGEX.test(s), "Invalid token ID format"),
});
