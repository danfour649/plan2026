import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { CANONICAL_ORIGIN, shouldRedirectToCanonicalHost } from "@/lib/site-url";

// NextAuth v4 database strategy: session is in DB; cookie holds the token.
// We only check cookie presence here to avoid layout flicker. Full session
// validation remains in (app)/layout.tsx via getServerAuthSession().
const SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
}

function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  if (!shouldRedirectToCanonicalHost(request.headers.get("host"))) {
    return null;
  }
  const url = new URL(request.url);
  const destination = new URL(`${url.pathname}${url.search}`, CANONICAL_ORIGIN);
  return NextResponse.redirect(destination, 308);
}

export function proxy(request: NextRequest) {
  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) return hostRedirect;

  const { pathname } = request.nextUrl;

  // Protect app routes: require session cookie so we redirect before layout runs
  if (
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/actions") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/supplies")
  ) {
    if (!hasSessionCookie(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow login page to redirect already-signed-in users (handled in login page)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all app paths so production host aliases can 308 to plan2026.ca.
     * Skip Next internals and common static file extensions.
     */
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
