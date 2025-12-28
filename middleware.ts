import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes (including root dashboard)
  const protectedRoutes = ["/", "/tasks", "/calendar", "/goals", "/focus", "/profile", "/training"];
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  if (isProtectedRoute) {
    // Check if user has auth session cookie
    const sessionToken = request.cookies.get("authjs.session-token") ||
                         request.cookies.get("__Secure-authjs.session-token");

    if (!sessionToken) {
      // Redirect to login if not authenticated
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|login).*)",
  ],
};
