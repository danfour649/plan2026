export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";

export const GOOGLE_SIGN_IN_SCOPES = ["openid", "email", "profile"] as const;

export const GOOGLE_SIGN_IN_SCOPE_STRING = GOOGLE_SIGN_IN_SCOPES.join(" ");

export const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "email",
  "profile",
  GOOGLE_CALENDAR_SCOPE,
] as const;

export const GOOGLE_CALENDAR_SCOPE_STRING = GOOGLE_CALENDAR_SCOPES.join(" ");

/** Basic sign-in: profile scopes only (no sensitive calendar scope). */
export const GOOGLE_SIGN_IN_PARAMS = {
  access_type: "offline",
  include_granted_scopes: "true",
  scope: GOOGLE_SIGN_IN_SCOPE_STRING,
} as const;

/** Incremental auth when user connects Google Calendar. */
export const GOOGLE_CALENDAR_PARAMS = {
  access_type: "offline",
  include_granted_scopes: "true",
  prompt: "consent",
  scope: GOOGLE_CALENDAR_SCOPE_STRING,
} as const;

export const CALENDAR_SCOPE_MISSING_CODE = "calendar_scope_missing" as const;

export function hasGoogleCalendarScope(scope: string | null | undefined) {
  return scope?.split(/\s+/).includes(GOOGLE_CALENDAR_SCOPE) ?? false;
}

export type GoogleCalendarAccountLink = {
  scope?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
};

/**
 * Settings label for Google Calendar:
 * - `connected` — calendar.events is granted and the stored token can be used or refreshed
 * - `reconnect` — that scope was granted, but the token is missing or expired with no refresh token
 * - `connect` — Calendar was never granted, or the user disconnected (scope cleared)
 */
export type GoogleCalendarLinkState = "connected" | "connect" | "reconnect";

function hasStoredToken(value: string | null | undefined) {
  return typeof value === "string" && value.length > 0;
}

export function getGoogleCalendarLinkState(
  account: GoogleCalendarAccountLink | null | undefined,
  nowMs: number = Date.now(),
): GoogleCalendarLinkState {
  if (!account || !hasGoogleCalendarScope(account.scope)) {
    return "connect";
  }

  const accessToken = hasStoredToken(account.access_token);
  const refreshToken = hasStoredToken(account.refresh_token);
  const expired = account.expires_at != null && account.expires_at * 1000 <= nowMs;

  if (!accessToken || (expired && !refreshToken)) {
    return "reconnect";
  }

  return "connected";
}
