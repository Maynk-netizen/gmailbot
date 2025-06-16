import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { connectDB } from "@/helpers/db";
// Updated import to use the renamed model
import GoogleUser from "@/models/googleuser";
import { MongoClient } from "mongodb";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";

// MongoDB connection for oauth_tokens collection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'gmail_bot';
const TOKENS_COLLECTION = 'oauth_tokens';

// Connect to MongoDB for token storage
async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db(DB_NAME);
}

// Create OAuth client
const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Interface for token data
interface TokenData {
  userId: string;
  email: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  tokens: {
    access_token: string;
    refresh_token?: string;
    scope: string;
    token_type: string;
    expiry_date: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    // Get the code from the URL
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
    }

    // Exchange the code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get user info
    const userInfoClient = new OAuth2Client();
    userInfoClient.setCredentials(tokens);
    
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );
    
    const userInfo = await userInfoResponse.json();
    
    // Connect to database
    await connectDB();
    
    // Updated to use GoogleUser instead of User
    let user = await GoogleUser.findOne({ email: userInfo.email });
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
      // Generate a unique username by adding a random suffix if needed
      let username = userInfo.name || userInfo.email.split('@')[0];
      let isUsernameUnique = false;
      let attempts = 0;
      
      // Check if username is unique, if not, add a random suffix
      while (!isUsernameUnique && attempts < 10) {
        const existingUser = await GoogleUser.findOne({ username });
        if (!existingUser) {
          isUsernameUnique = true;
        } else {
          // Add random suffix to make username unique
          username = `${userInfo.name || userInfo.email.split('@')[0]}_${Math.floor(Math.random() * 10000)}`;
          attempts++;
        }
      }
      
      // Updated to use GoogleUser instead of User
      user = await GoogleUser.create({
        email: userInfo.email,
        username: username,
        googleId: userInfo.sub,
        profilePicture: userInfo.picture,
      });
    } else {
      // Update user info if needed
      user.googleId = userInfo.sub;
      user.profilePicture = userInfo.picture;
      await user.save();
    }
    
    // If this is a new user, save their OAuth tokens
    if (isNewUser) {
      try {
        // Save the tokens to MongoDB oauth_tokens collection
        const tokenData: TokenData = {
          userId: user._id.toString(),
          email: userInfo.email,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          tokens: {
            access_token: tokens.access_token || '',
            refresh_token: tokens.refresh_token || undefined,
            scope: tokens.scope || '',
            token_type: tokens.token_type || 'Bearer',
            expiry_date: tokens.expiry_date || Date.now() + 3600000,
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Connect to MongoDB and save the token
        const db = await connectToMongoDB();
        const tokensCollection = db.collection(TOKENS_COLLECTION);
        
        // Update if exists, insert if not - using email as the identifier
        await tokensCollection.updateOne(
          { email: userInfo.email },
          { $set: tokenData },
          { upsert: true }
        );
        
        console.log(`OAuth tokens saved for new user: ${userInfo.email}`);
      } catch (tokenError) {
        console.error("Error saving OAuth tokens:", tokenError);
        // Continue with authentication even if token saving fails
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Set cookie - Fix: Use the Response object to set cookies instead of cookies() API
    // Changed redirect from /profile to /dashboard
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    
    // Add the cookie to the response
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
    });
    
    // Return the response with the cookie
    return response;
    
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}