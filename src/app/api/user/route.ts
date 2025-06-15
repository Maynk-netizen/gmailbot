import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/helpers/db";
import GoogleUser from "@/models/googleuser";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      id: string;
      email: string;
      username: string;
    };
    
    // Connect to database to get additional user info like profile picture
    await connectDB();
    const user = await GoogleUser.findById(decoded.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Return user information including profile picture
    return NextResponse.json({ 
      id: user._id,
      email: user.email,
      username: user.username,
      profilePicture: user.profilePicture
    });
    
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}