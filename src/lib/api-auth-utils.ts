import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Prefix for personal API tokens created in Settings or via `pnpm run api:create-token`. */
export const API_TOKEN_PREFIX = "p26_";

/** Leading characters of the raw token stored in plain text so users can recognize it later. */
export const API_TOKEN_DISPLAY_PREFIX_LENGTH = 12;

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Generate a new personal API token. The raw token is shown to the user once;
 * only its hash and display prefix are persisted.
 */
export function generateApiToken(): {
  rawToken: string;
  tokenHash: string;
  tokenPrefix: string;
} {
  const rawToken = `${API_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  return {
    rawToken,
    tokenHash: hashApiToken(rawToken),
    tokenPrefix: rawToken.slice(0, API_TOKEN_DISPLAY_PREFIX_LENGTH),
  };
}

export function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/** Constant-time compare for optional hardening when verifying raw tokens. */
export function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
