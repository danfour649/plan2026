import { afterEach, describe, expect, it } from "vitest";

import {
  FACEBOOK_GRAPH_VERSION,
  FACEBOOK_OAUTH_SCOPE,
  FACEBOOK_OAUTH_SCOPES,
  facebookAuthorizationUrl,
  facebookTokenUrl,
  facebookUserinfoUrl,
  isFacebookLoginEnabled,
  mapFacebookProfile,
} from "./facebook-login";

const FACEBOOK_ENV_KEYS = ["AUTH_FACEBOOK_ENABLED", "AUTH_FACEBOOK_ID", "AUTH_FACEBOOK_SECRET"] as const;
const originalEnv = Object.fromEntries(FACEBOOK_ENV_KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of FACEBOOK_ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("facebook-login provider config", () => {
  it("pins a current Graph API version", () => {
    expect(FACEBOOK_GRAPH_VERSION).toMatch(/^v\d+\.\d+$/);
    expect(FACEBOOK_GRAPH_VERSION).toBe("v26.0");
  });

  it("builds versioned OAuth endpoints", () => {
    expect(facebookAuthorizationUrl()).toBe("https://www.facebook.com/v26.0/dialog/oauth");
    expect(facebookTokenUrl()).toBe("https://graph.facebook.com/v26.0/oauth/access_token");
    expect(facebookUserinfoUrl()).toBe("https://graph.facebook.com/v26.0/me");
  });

  it("requests exactly the App Review scopes", () => {
    expect(FACEBOOK_OAUTH_SCOPES).toEqual(["public_profile", "email"]);
    expect(FACEBOOK_OAUTH_SCOPE).toBe("public_profile email");
  });
});

describe("isFacebookLoginEnabled", () => {
  it("requires the flag AND both credentials", () => {
    process.env.AUTH_FACEBOOK_ENABLED = "true";
    process.env.AUTH_FACEBOOK_ID = "app-id";
    process.env.AUTH_FACEBOOK_SECRET = "app-secret";
    expect(isFacebookLoginEnabled()).toBe(true);

    process.env.AUTH_FACEBOOK_ENABLED = "1";
    expect(isFacebookLoginEnabled()).toBe(true);

    delete process.env.AUTH_FACEBOOK_SECRET;
    expect(isFacebookLoginEnabled()).toBe(false);
  });

  it("is disabled without the flag even when credentials exist", () => {
    delete process.env.AUTH_FACEBOOK_ENABLED;
    process.env.AUTH_FACEBOOK_ID = "app-id";
    process.env.AUTH_FACEBOOK_SECRET = "app-secret";
    expect(isFacebookLoginEnabled()).toBe(false);

    process.env.AUTH_FACEBOOK_ENABLED = "false";
    expect(isFacebookLoginEnabled()).toBe(false);
  });
});

describe("mapFacebookProfile", () => {
  it("maps a full profile", () => {
    expect(
      mapFacebookProfile({
        id: "123",
        name: "Jane Doe",
        email: "jane@example.com",
        picture: { data: { url: "https://example.com/pic.jpg" } },
      }),
    ).toEqual({
      id: "123",
      name: "Jane Doe",
      email: "jane@example.com",
      image: "https://example.com/pic.jpg",
    });
  });

  it("does not throw when picture is missing (the old default mapping did)", () => {
    expect(mapFacebookProfile({ id: "123", name: "Jane Doe", email: "jane@example.com" })).toEqual({
      id: "123",
      name: "Jane Doe",
      email: "jane@example.com",
      image: null,
    });
    expect(
      mapFacebookProfile({ id: "123", name: "Jane Doe", email: "jane@example.com", picture: {} }),
    ).toEqual({ id: "123", name: "Jane Doe", email: "jane@example.com", image: null });
    expect(
      mapFacebookProfile({ id: "123", name: "Jane Doe", email: "jane@example.com", picture: { data: {} } }),
    ).toEqual({ id: "123", name: "Jane Doe", email: "jane@example.com", image: null });
  });

  it("allows a null email for phone-number Facebook accounts", () => {
    expect(mapFacebookProfile({ id: "123", name: "Jane Doe" })).toEqual({
      id: "123",
      name: "Jane Doe",
      email: null,
      image: null,
    });
  });
});
