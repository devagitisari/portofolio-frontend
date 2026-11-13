import { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "deva_admin_session";

// Server-side guard for the admin UI. This is defense-in-depth only:
// the real security boundary is the backend's auth:sanctum middleware.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const hasAdminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value === "1";

  if (!hasAdminSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin-login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
