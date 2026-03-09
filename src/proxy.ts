import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect app routes: require session cookie so we redirect before layout runs
  if (
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/about")
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
  matcher: ["/tasks/:path*", "/settings/:path*", "/plans/:path*", "/help/:path*", "/about/:path*"],
};
