import { describe, expect, it } from "vitest";

import { GOOGLE_CALENDAR_SCOPE, getGoogleCalendarLinkState } from "./google-oauth";

const NOW = Date.parse("2026-10-18T12:00:00Z");
const FUTURE = Math.floor(Date.parse("2026-10-18T13:00:00Z") / 1000);
const PAST = Math.floor(Date.parse("2026-10-18T11:00:00Z") / 1000);
const CALENDAR_SCOPE = `openid email profile ${GOOGLE_CALENDAR_SCOPE}`;
const SIGN_IN_SCOPE = "openid email profile";

describe("getGoogleCalendarLinkState", () => {
  it("asks to connect when Calendar was never granted or was disconnected", () => {
    expect(getGoogleCalendarLinkState(null, NOW)).toBe("connect");
    expect(getGoogleCalendarLinkState(undefined, NOW)).toBe("connect");
    expect(
      getGoogleCalendarLinkState(
        {
          scope: SIGN_IN_SCOPE,
          access_token: "access",
          refresh_token: "refresh",
          expires_at: FUTURE,
        },
        NOW,
      ),
    ).toBe("connect");
    expect(
      getGoogleCalendarLinkState(
        { scope: null, access_token: null, refresh_token: null, expires_at: null },
        NOW,
      ),
    ).toBe("connect");
  });

  it("stays connected while the calendar token can be used or refreshed", () => {
    expect(
      getGoogleCalendarLinkState(
        {
          scope: CALENDAR_SCOPE,
          access_token: "access",
          refresh_token: "refresh",
          expires_at: FUTURE,
        },
        NOW,
      ),
    ).toBe("connected");
    expect(
      getGoogleCalendarLinkState(
        {
          scope: CALENDAR_SCOPE,
          access_token: "access",
          refresh_token: null,
          expires_at: FUTURE,
        },
        NOW,
      ),
    ).toBe("connected");
    expect(
      getGoogleCalendarLinkState(
        {
          scope: CALENDAR_SCOPE,
          access_token: "access",
          refresh_token: "refresh",
          expires_at: PAST,
        },
        NOW,
      ),
    ).toBe("connected");
    expect(
      getGoogleCalendarLinkState(
        {
          scope: CALENDAR_SCOPE,
          access_token: "access",
          refresh_token: null,
          expires_at: null,
        },
        NOW,
      ),
    ).toBe("connected");
  });

  it("asks to reconnect only when an existing calendar grant cannot be used", () => {
    expect(
      getGoogleCalendarLinkState(
        {
          scope: CALENDAR_SCOPE,
          access_token: "access",
          refresh_token: null,
          expires_at: PAST,
        },
        NOW,
      ),
    ).toBe("reconnect");
    expect(
      getGoogleCalendarLinkState(
        {
          scope: CALENDAR_SCOPE,
          access_token: null,
          refresh_token: "refresh",
          expires_at: FUTURE,
        },
        NOW,
      ),
    ).toBe("reconnect");
    expect(
      getGoogleCalendarLinkState(
        {
          scope: CALENDAR_SCOPE,
          access_token: "   ",
          refresh_token: "",
          expires_at: PAST,
        },
        NOW,
      ),
    ).toBe("reconnect");
  });
});
