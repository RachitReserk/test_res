import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth tokens
  const authToken = request.cookies.get("authToken")?.value
  const clientAuthToken = request.cookies.get("clientAuthToken")?.value

  // Paths that are accessible without authentication
  const authRoutes = ["/auth/login", "/auth/forgot-password"]
  const clientAuthRoutes = ["/client/login"]

  // Public routes that should always be accessible without any auth
  const publicRoutes = ["/", "/client/home", "/checkout", "/order-confirmation"]

  // Check if the current path is a client auth route (like /client/login)
  const isClientAuthRoute = clientAuthRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // Check if the current path is an auth route (like /auth/login)
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // Admin dashboard routes (require authToken)
  const isAdminRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/menu/") ||
    pathname.startsWith("/management/") ||
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/analytics/")

  // Protected client routes (client routes that require clientAuthToken)
  const isProtectedClientRoute = pathname.startsWith("/client/") && !isClientAuthRoute && !isPublicRoute

  // Handle admin routes - redirect to admin login
  // if (isAdminRoute && !authToken) {
  //   return NextResponse.redirect(new URL("/auth/login", request.url))
  // }

  // Handle protected client routes - redirect to client login
  if (isProtectedClientRoute && !clientAuthToken) {
    // Store the current URL to redirect back after login
    const url = new URL("/client/login", request.url)
    url.searchParams.set("callbackUrl", encodeURIComponent(request.nextUrl.pathname))
    return NextResponse.redirect(url)
  }

  // Allow all other routes to proceed without redirection
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

