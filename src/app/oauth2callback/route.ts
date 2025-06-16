import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { google } from 'googleapis';
import { MongoClient } from 'mongodb';

// Update the SCOPES array to include the userinfo.email scope
const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/pubsub', // Added Pub/Sub scope to match reader.ts
  'https://www.googleapis.com/auth/userinfo.email', // Add this scope for email access
  'https://www.googleapis.com/auth/userinfo.profile' // Add profile scope as well
];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'gmail_bot';
const TOKENS_COLLECTION = 'oauth_tokens';

// Interface for token data
interface TokenData {
  userId: string; // You can use this to identify different users
  email: string;  // Add email field to store the user's email
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

interface TokenResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: number;
    id_token?: string;
  };
}

interface UserProfile {
  email: string;
  name: string;
  picture?: string;
}

// Connect to MongoDB
async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db(DB_NAME);
}

// Load credentials from credentials.json
async function getCredentials() {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    let client_id, client_secret, redirect_uris;

    if (credentials.installed) {
      client_id = credentials.installed.client_id;
      client_secret = credentials.installed.client_secret;
      redirect_uris = credentials.installed.redirect_uris;
    } else if (credentials.web) {
      client_id = credentials.web.client_id;
      client_secret = credentials.web.client_secret;
      redirect_uris = credentials.web.redirect_uris;
    } else {
      throw new Error('Unsupported credentials format');
    }

    // Use the exact redirect URI from the credentials file
    const redirect_uri = Array.isArray(redirect_uris) ? redirect_uris[0] : 'http://localhost:3000/oauth2callback';
    return { client_id, client_secret, redirect_uri };
  } catch (err: any) {
    throw new Error(`Failed to load credentials: ${err.message}`);
  }
}

// Create OAuth2 client
async function createOAuth2Client() {
  const { client_id, client_secret, redirect_uri } = await getCredentials();
  return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
}

// GET endpoint to handle OAuth callback
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect('/login?error=NoCodeProvided');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code) as TokenResponse;
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const { data: userInfo } = await oauth2.userinfo.get() as { data: UserProfile };

    let userEmail = userInfo.email;

    if (!userEmail && tokens.id_token) {
      try {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (payload?.email) {
          userEmail = payload.email;
        }
      } catch (error) {
        console.error('Error verifying ID token:', error);
      }
    }

    if (!userEmail) {
      try {
        const gmail = google.gmail({
          version: 'v1',
          auth: oauth2Client
        });
        const response = await gmail.users.getProfile({
          userId: 'me'
        });
        if (response.data.emailAddress) {
          userEmail = response.data.emailAddress;
        }
      } catch (error) {
        console.error('Error getting Gmail profile:', error);
      }
    }

    if (!userEmail) {
      return NextResponse.redirect('/login?error=NoEmailFound');
    }

    // Save the tokens to MongoDB
    const { client_id, client_secret, redirect_uri } = await getCredentials();
    
    // Ensure tokens match the expected type
    const tokenData: TokenData = {
      userId: 'default',
      email: userEmail,
      client_id,
      client_secret,
      redirect_uri,
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
    
    // Update if exists, insert if not - now using email as the identifier
    await tokensCollection.updateOne(
      { email: userEmail },
      { $set: tokenData },
      { upsert: true }
    );

    // Return a success page with the email displayed
    return NextResponse.redirect('/dashboard');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect('/login?error=AuthenticationFailed');
  }
}