import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

// Create OAuth client
const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export async function GET(request: NextRequest) {
  // Generate the url that will be used for the consent dialog
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      // User profile scopes
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      
      // Gmail API scopes
      'https://mail.google.com/', // Full access to Gmail
      'https://www.googleapis.com/auth/gmail.modify', // Modify Gmail settings and send emails
      'https://www.googleapis.com/auth/gmail.readonly', // Read Gmail messages
      'https://www.googleapis.com/auth/gmail.send', // Send emails
      'https://www.googleapis.com/auth/gmail.compose', // Compose emails
      'https://www.googleapis.com/auth/gmail.settings.basic', // Basic Gmail settings
      'https://www.googleapis.com/auth/gmail.settings.sharing', // Gmail sharing settings
      
      // Pub/Sub scopes for notifications
      'https://www.googleapis.com/auth/pubsub',
      'https://www.googleapis.com/auth/cloud-platform'
    ],
    prompt: 'consent', // Force consent screen
    include_granted_scopes: true,
    response_type: 'code'
  });

  return NextResponse.redirect(authorizeUrl);
}