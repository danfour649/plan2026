/**
 * Facebook login is opt-in: set AUTH_FACEBOOK_ENABLED=true (or 1) with AUTH_FACEBOOK_* credentials.
 * Enabled in Vercel Production as of June 2026 for Meta App Review. See GO-LIVE-FACEBOOK.md.
 */
export function isFacebookLoginEnabled(): boolean {
  const flag = process.env.AUTH_FACEBOOK_ENABLED;
  if (flag !== "true" && flag !== "1") return false;
  return Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET);
}

/**
 * Pinned Facebook Graph API version for OAuth endpoints.
 * NextAuth v4's built-in Facebook provider still points at v11.0 (retired),
 * so src/auth.ts overrides authorization/token/userinfo with these URLs.
 * Newest version per https://developers.facebook.com/docs/graph-api/changelog/
 * (v26.0, released 2026-07-29). Bump deliberately after checking the changelog.
 */
export const FACEBOOK_GRAPH_VERSION = "v26.0";

/** Exactly the permissions submitted for Meta App Review — nothing more. */
export const FACEBOOK_OAUTH_SCOPES = ["public_profile", "email"] as const;
export const FACEBOOK_OAUTH_SCOPE = FACEBOOK_OAUTH_SCOPES.join(" ");

/** Fields requested from /me. `picture.type(large)` matches the previous default avatar size. */
export const FACEBOOK_USERINFO_FIELDS = "id,name,email,picture.type(large)";

export function facebookAuthorizationUrl(): string {
  return `https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth`;
}

export function facebookTokenUrl(): string {
  return `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token`;
}

export function facebookUserinfoUrl(): string {
  return `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me`;
}

/** Shape returned by Graph API /me for the fields in FACEBOOK_USERINFO_FIELDS. */
export interface FacebookProfilePayload {
  id: string;
  name?: string | null;
  /** Facebook accounts registered with a phone number may have no email. */
  email?: string | null;
  picture?: {
    data?: {
      url?: string | null;
    } | null;
  } | null;
}

/**
 * Null-safe replacement for NextAuth v4's default Facebook profile mapping,
 * which throws on `profile.picture.data.url` when a user has no picture.
 * A null email is allowed: the Prisma `User.email` column is nullable, so the
 * adapter creates the account without an email instead of failing sign-in.
 */
export function mapFacebookProfile(profile: FacebookProfilePayload) {
  return {
    id: profile.id,
    name: profile.name ?? null,
    email: profile.email ?? null,
    image: profile.picture?.data?.url ?? null,
  };
}
