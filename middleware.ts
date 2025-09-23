import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/subscriptions", "/orders", "/profile", "/admin"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default withAuth(
  (req) => {
    const { pathname, origin } = req.nextUrl;
    const token = req.nextauth.token;
    const isAuthenticated = Boolean(token);
    const isAdminRoute = pathname.startsWith("/admin");
    const isAuthRoute = pathname.startsWith("/auth");

    if (!isAuthenticated && isProtectedPath(pathname)) {
      const signInUrl = new URL("/auth/signin", origin);
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(signInUrl);
    }

    if (isAuthenticated && isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }

    if (isAuthenticated && isAdminRoute) {
      const role = token?.role;
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", origin));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  },
);

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/subscriptions/:path*",
    "/orders",
    "/orders/:path*",
    "/profile",
    "/admin",
    "/admin/:path*",
    "/auth/:path*",
  ],
};
