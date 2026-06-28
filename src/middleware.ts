import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware for basic auth gating of protected pages.
 * Detailed JWT verification happens in server components / API routes
 * (jose works in edge, but we keep this lightweight: presence check only).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  const isProtectedPage =
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/api-keys") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin");

  if (isProtectedPage && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/jobs/:path*", "/api-keys/:path*", "/settings/:path*", "/admin/:path*"],
};
