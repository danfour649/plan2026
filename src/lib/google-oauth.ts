export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";

export const GOOGLE_AUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  GOOGLE_CALENDAR_SCOPE,
] as const;

export const GOOGLE_AUTH_SCOPE_STRING = GOOGLE_AUTH_SCOPES.join(" ");

export const GOOGLE_AUTHORIZATION_PARAMS = {
  access_type: "offline",
  include_granted_scopes: "true",
  prompt: "consent",
  scope: GOOGLE_AUTH_SCOPE_STRING,
} as const;

export function hasGoogleCalendarScope(scope: string | null | undefined) {
  return scope?.split(/\s+/).includes(GOOGLE_CALENDAR_SCOPE) ?? false;
}
