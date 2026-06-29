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
