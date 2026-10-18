import { describe, expect, it } from "vitest";

import { getTranslations, LOCALES } from "./i18n";

const EXACT_LIMITED_USE =
  "Plan 2026's use and transfer of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.";

const POLICY_URL = "https://developers.google.com/terms/api-services-user-data-policy";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

describe("Google user data copy", () => {
  it("states the exact Limited Use disclosure in English", () => {
    const copy = getTranslations("en").privacy.googleUserData;
    expect(copy.limitedUseBefore + copy.limitedUseLinkLabel + copy.limitedUseAfter).toBe(EXACT_LIMITED_USE);
    expect(copy.policyUrl).toBe(POLICY_URL);
    expect(copy.anchorId).toBe("google-user-data");
  });

  it("covers access, use, storage, sharing, human access, revoke, deletion, and AI limits in every language", () => {
    for (const locale of LOCALES) {
      const t = getTranslations(locale);
      const copy = t.privacy.googleUserData;
      const text = [
        ...copy.paragraphs,
        copy.revokeBefore,
        copy.revokeLinkLabel,
        copy.revokeAfter,
        copy.deletionStatement,
        copy.aiStatement,
        copy.limitedUseBefore,
        copy.limitedUseLinkLabel,
        copy.limitedUseAfter,
      ].join(" ");

      expect(t.privacy.sections.some((section) => section.title === copy.insertAfterTitle)).toBe(true);
      expect(copy.anchorId).toBe("google-user-data");
      expect(copy.policyUrl).toBe(POLICY_URL);
      expect(copy.revokeUrl).toBe("https://myaccount.google.com/permissions");
      expect(text).toContain(CALENDAR_SCOPE);
      expect(text).toContain("Limited Use");
      expect(text).toContain("Google API Services User Data Policy");
      expect(text).toMatch(/train generalized AI|entraîner des modèles d'IA/);
      expect(t.home.googleLimitedUse).toContain("Limited Use");
      expect(t.home.googleLimitedUseDetails.length).toBeGreaterThan(0);
      expect(t.calendar.connectGoogleCalendar).not.toBe(t.calendar.reconnectGoogleCalendar);
      expect(t.settings.calendarNeedsReauth.length).toBeGreaterThan(0);
    }
  });
});
