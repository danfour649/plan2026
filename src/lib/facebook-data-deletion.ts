import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Meta Data Deletion Callback support.
 * Meta POSTs a `signed_request` form field to the callback URL when a user
 * removes the app from Facebook Settings → Apps and Websites. Format:
 *   base64url(HMAC_SHA256 signature) "." base64url(JSON payload)
 * signed with the app secret. Docs:
 * https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */

export interface FacebookSignedRequestPayload {
  algorithm?: string;
  issued_at?: number;
  user_id?: string;
  [key: string]: unknown;
}

function base64UrlToBuffer(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Verify and decode a Meta `signed_request`. Returns the payload, or null if
 * the signature does not match, the algorithm is unexpected, or the input is
 * malformed. Never throws.
 */
export function parseFacebookSignedRequest(
  signedRequest: string,
  appSecret: string,
): FacebookSignedRequestPayload | null {
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;
  const [encodedSignature, encodedPayload] = parts as [string, string];

  let payload: FacebookSignedRequestPayload;
  try {
    payload = JSON.parse(base64UrlToBuffer(encodedPayload).toString("utf8")) as FacebookSignedRequestPayload;
  } catch {
    return null;
  }
  if (payload.algorithm !== undefined && payload.algorithm !== "HMAC-SHA256") return null;

  const expected = createHmac("sha256", appSecret).update(encodedPayload).digest();
  const actual = base64UrlToBuffer(encodedSignature);
  if (actual.length !== expected.length) return null;
  if (!timingSafeEqual(actual, expected)) return null;

  return payload;
}

/** Opaque code Meta shows the user; they can check status at /privacy/deletion-status?code=… */
export function generateDeletionConfirmationCode(): string {
  return randomBytes(16).toString("hex");
}
