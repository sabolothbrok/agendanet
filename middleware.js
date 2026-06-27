import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "./lib/auth-cookie";
import {
  getSessionCookieMaxAge,
  getSessionCookieOptions,
  getSessionExpiryState,
  touchSessionTimestamps,
} from "./lib/session-policy";

function parseSession(request) {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function withNoStore(response) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", getSessionCookieOptions(0));
}

function touchSessionCookie(response, session) {
  const touched = touchSessionTimestamps(session);
  response.cookies.set(
    SESSION_COOKIE,
    JSON.stringify(touched),
    getSessionCookieOptions(getSessionCookieMaxAge(touched))
  );
  return touched;
}

function redirectToLogin(request, pathname, query = {}) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  const response = NextResponse.redirect(url);
  return response;
}

function requireAuth(request, session, loginPath, isAuthorized) {
  if (!session) {
    const response = redirectToLogin(request, loginPath, { loggedOut: "1" });
    return response;
  }

  const expiry = getSessionExpiryState(session);
  if (expiry.expired) {
    const response = redirectToLogin(request, loginPath, {
      loggedOut: "1",
      expired: "1",
    });
    clearSessionCookie(response);
    return response;
  }

  if (!isAuthorized(session)) {
    const response = redirectToLogin(request, loginPath, { loggedOut: "1" });
    clearSessionCookie(response);
    return response;
  }

  const response = withNoStore(NextResponse.next());
  touchSessionCookie(response, session);
  return response;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = parseSession(request);

  const clientMatch = pathname.match(/^\/b\/([^/]+)\/app(\/.*)?$/);
  if (clientMatch) {
    const slug = clientMatch[1];
    if (pathname !== `/b/${slug}/app/login`) {
      return requireAuth(
        request,
        session,
        `/b/${slug}/app/login`,
        (s) => s.role === "customer" && s.businessSlug === slug
      );
    }
  }

  const adminMatch = pathname.match(/^\/b\/([^/]+)\/admin(\/.*)?$/);
  if (adminMatch) {
    const slug = adminMatch[1];
    if (pathname !== `/b/${slug}/admin/login`) {
      return requireAuth(
        request,
        session,
        `/b/${slug}/admin/login`,
        (s) =>
          (s.role === "admin" && s.businessSlug === slug) || s.role === "platform_admin"
      );
    }
  }

  if (pathname === "/platform" || pathname.startsWith("/platform/")) {
    if (pathname !== "/platform/login") {
      return requireAuth(
        request,
        session,
        "/platform/login",
        (s) => s.role === "platform_admin"
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/b/:slug/app",
    "/b/:slug/app/:path*",
    "/b/:slug/admin",
    "/b/:slug/admin/:path*",
    "/platform",
    "/platform/:path*",
  ],
};
