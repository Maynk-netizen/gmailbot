import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the path the user is trying to access
  const path = request.nextUrl.pathname;
  
  // Define paths that require authentication
  const isProtectedRoute = path === "/dashboard" || path.startsWith("/dashboard/");
  
  // Define public paths
  const isPublicPath = path === "/login" || path === "/signin" || path.startsWith("/api/auth");
  
  // Get the token from cookies
  const token = request.cookies.get("token")?.value;
  
  // If trying to access protected route without token, redirect to signin
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  
  // If trying to access login/signin with a valid token, redirect to dashboard
  if (isPublicPath && token) {
    try {
      // If token exists, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
      // If token is invalid, continue to public path
      console.log(error);
      return NextResponse.next();
    }
  }
  
  // For all other cases, continue normally
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signin",
  ],
};