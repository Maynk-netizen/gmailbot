import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Create response that redirects to login page
    const response = NextResponse.redirect(new URL("/login", request.url));
    
    // Clear the token cookie
    response.cookies.set({
      name: "token",
      value: "",
      expires: new Date(0), // Set expiration to the past to delete the cookie
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}