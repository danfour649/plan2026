import type { Messages } from "@/lib/i18n";

/** NextAuth error codes forwarded to custom `pages.error` (see auth.ts). */
export const KNOWN_AUTH_ERRORS = [
  "OAuthAccountNotLinked",
  "Configuration",
  "AccessDenied",
  "Verification",
] as const;

export type KnownAuthError = (typeof KNOWN_AUTH_ERRORS)[number];

export function isKnownAuthError(error: string | undefined): error is KnownAuthError {
  return KNOWN_AUTH_ERRORS.includes(error as KnownAuthError);
}

export function getLoginAuthErrorMessage(t: Messages, error: string | undefined): string | null {
  if (!error) return null;
  switch (error) {
    case "OAuthAccountNotLinked":
      return t.login.accountNotLinked;
    case "Configuration":
      return t.login.authErrorConfiguration;
    case "AccessDenied":
      return t.login.authErrorAccessDenied;
    case "Verification":
      return t.login.authErrorVerification;
    default:
      return t.login.authErrorGeneric;
  }
}

export function getSettingsLinkErrorMessage(t: Messages, error: string | undefined): string | null {
  if (!error) return null;
  switch (error) {
    case "OAuthAccountNotLinked":
      return t.settings.linkErrorAccountNotLinked;
    case "Configuration":
      return t.settings.linkErrorConfiguration;
    case "AccessDenied":
      return t.settings.linkErrorAccessDenied;
    case "Verification":
      return t.settings.linkErrorVerification;
    default:
      return t.settings.linkErrorGeneric;
  }
}
