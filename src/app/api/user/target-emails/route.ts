import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/helpers/db";
import GoogleUser from "@/models/googleuser";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";

// Get all target emails for the current user
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
    
    // Connect to database
    await connectDB();
    
    // Find user and get their target emails and messages
    const user = await GoogleUser.findById(decoded.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      targetEmails: user.targetEmails || [],
      targetEmailMessages: user.targetEmailMessages || []
    });
    
  } catch (error) {
    console.error("Error fetching target emails:", error);
    return NextResponse.json({ error: "Failed to fetch target emails" }, { status: 500 });
  }
}

// Add a new target email
export async function POST(request: NextRequest) {
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
    
    // Get email from request body
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    // Connect to database
    await connectDB();
    
    // Find user and update their target emails
    const user = await GoogleUser.findById(decoded.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if email already exists in the array
    if (user.targetEmails && user.targetEmails.includes(email)) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    
    // Add the new email to the array
    user.targetEmails = [...(user.targetEmails || []), email];
    await user.save();
    
    return NextResponse.json({ 
      success: true, 
      message: "Email added successfully",
      targetEmails: user.targetEmails
    });
    
  } catch (error) {
    console.error("Error adding target email:", error);
    return NextResponse.json({ error: "Failed to add target email" }, { status: 500 });
  }
}

// Delete a target email
export async function DELETE(request: NextRequest) {
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
    
    // Get email from request body
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    // Connect to database
    await connectDB();
    
    // Find user and update their target emails
    const user = await GoogleUser.findById(decoded.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Remove the email from the array - Fixed the TypeScript error by adding a type annotation
    user.targetEmails = (user.targetEmails || []).filter((e: string) => e !== email);
    await user.save();
    
    return NextResponse.json({ 
      success: true, 
      message: "Email removed successfully",
      targetEmails: user.targetEmails
    });
    
  } catch (error) {
    console.error("Error removing target email:", error);
    return NextResponse.json({ error: "Failed to remove target email" }, { status: 500 });
  }
}
