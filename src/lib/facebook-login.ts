/**
 * Facebook login is opt-in: set AUTH_FACEBOOK_ENABLED=true (or 1) with AUTH_FACEBOOK_* credentials.
 * Keeps production Google-only until Meta App Review is complete.
 *
 * TODO(re-enable-facebook-login): After Meta business verification + App Review (public_profile,
 * email) and app switched to Live, set AUTH_FACEBOOK_ENABLED=true in Vercel Production and redeploy.
 */
export function isFacebookLoginEnabled(): boolean {
  const flag = process.env.AUTH_FACEBOOK_ENABLED;
  if (flag !== "true" && flag !== "1") return false;
  return Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET);
}
