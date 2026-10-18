import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { generateDeletionConfirmationCode, parseFacebookSignedRequest } from "./facebook-data-deletion";

const SECRET = "test-app-secret";

function toBase64Url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Build a signed_request exactly the way Meta does. */
function makeSignedRequest(payload: unknown, secret: string = SECRET): string {
  const encodedPayload = toBase64Url(Buffer.from(JSON.stringify(payload), "utf8"));
  const signature = createHmac("sha256", secret).update(encodedPayload).digest();
  return `${toBase64Url(signature)}.${encodedPayload}`;
}

describe("parseFacebookSignedRequest", () => {
  it("verifies and decodes a valid signed_request", () => {
    const signed = makeSignedRequest({ algorithm: "HMAC-SHA256", issued_at: 123, user_id: "fb-42" });
    expect(parseFacebookSignedRequest(signed, SECRET)).toMatchObject({ user_id: "fb-42" });
  });

  it("rejects a signature made with the wrong secret", () => {
    const signed = makeSignedRequest({ algorithm: "HMAC-SHA256", user_id: "fb-42" }, "other-secret");
    expect(parseFacebookSignedRequest(signed, SECRET)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const signed = makeSignedRequest({ algorithm: "HMAC-SHA256", user_id: "fb-42" });
    const [signature] = signed.split(".");
    const forgedPayload = toBase64Url(
      Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", user_id: "fb-attacker" }), "utf8"),
    );
    expect(parseFacebookSignedRequest(`${signature}.${forgedPayload}`, SECRET)).toBeNull();
  });

  it("rejects malformed input without throwing", () => {
    expect(parseFacebookSignedRequest("", SECRET)).toBeNull();
    expect(parseFacebookSignedRequest("no-dot-here", SECRET)).toBeNull();
    expect(parseFacebookSignedRequest("a.b.c", SECRET)).toBeNull();
    expect(parseFacebookSignedRequest("!!!.@@@", SECRET)).toBeNull();
  });

  it("rejects an unexpected algorithm", () => {
    const signed = makeSignedRequest({ algorithm: "none", user_id: "fb-42" });
    expect(parseFacebookSignedRequest(signed, SECRET)).toBeNull();
  });
});

describe("generateDeletionConfirmationCode", () => {
  it("returns unique 32-char hex codes", () => {
    const a = generateDeletionConfirmationCode();
    const b = generateDeletionConfirmationCode();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(b).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(b);
  });
});
