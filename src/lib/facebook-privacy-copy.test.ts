import { describe, expect, it } from "vitest";

import { getTranslations, LOCALES } from "./i18n";

describe("Facebook privacy copy", () => {
  it("keeps a stable data-deletion anchor and the Facebook sign-in disclosure in every language", () => {
    for (const locale of LOCALES) {
      const privacy = getTranslations(locale).privacy;
      const deletion = privacy.sections.find(
        (section) => "id" in section && section.id === "data-deletion",
      );
      expect(deletion?.title.length).toBeGreaterThan(0);

      const providers = privacy.sections.find((section) =>
        section.paragraphs.some((paragraph) => paragraph.includes("public_profile")),
      );
      const providerText = providers?.paragraphs.join(" ") ?? "";
      expect(providerText).toContain("public_profile");
      expect(providerText.toLowerCase()).toMatch(/email|courriel/);
      expect(providerText).toMatch(/Apps and Websites|Applications et sites web/);

      const deletionText = deletion?.paragraphs.join(" ") ?? "";
      expect(deletionText).toContain("/privacy/deletion-status");
      expect(deletionText).toContain("danfour@gmail.com");
    }
  });
});
