import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "ls_session";

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs before /dashboard, /login and /signup render. It checks the session
 * signature only; getCurrentUser() still confirms the user exists.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = await hasValidSession(request);

  let response: NextResponse;
  if (pathname.startsWith("/dashboard") && !signedIn) {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else if ((pathname === "/login" || pathname === "/signup") && signedIn) {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
    response = NextResponse.next();
  }

  // Drop an expired or tampered cookie so it can't cause redirect loops.
  if (!signedIn && request.cookies.has(SESSION_COOKIE)) {
    response.cookies.delete(SESSION_COOKIE);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
