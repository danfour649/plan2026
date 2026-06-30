/**
 * Facebook login is opt-in: set AUTH_FACEBOOK_ENABLED=true (or 1) with AUTH_FACEBOOK_* credentials.
 * Enabled in Vercel Production as of June 2026 for Meta App Review. See GO-LIVE-FACEBOOK.md.
 */
export function isFacebookLoginEnabled(): boolean {
  const flag = process.env.AUTH_FACEBOOK_ENABLED;
  if (flag !== "true" && flag !== "1") return false;
  return Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET);
}
