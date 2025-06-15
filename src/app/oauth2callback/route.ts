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
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    // Check if there's an error in the callback
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.json({ error: `Authentication error: ${error}` }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    const auth = await createOAuth2Client();

    // Exchange the authorization code for tokens
    try {
      const { tokens } = await auth.getToken(code);
      auth.setCredentials(tokens);
      
      // Extract email directly from the ID token if available
      let userEmail = 'unknown@example.com';
      
      if (tokens.id_token) {
        try {
          // Decode the ID token to get user info
          const ticket = await auth.verifyIdToken({
            idToken: tokens.id_token,
            audience: (await getCredentials()).client_id,
          });
          const payload = ticket.getPayload();
          if (payload && payload.email) {
            userEmail = payload.email;
            console.log('Email extracted from ID token:', userEmail);
          }
        } catch (idTokenError) {
          console.error('Error decoding ID token:', idTokenError);
        }
      }
      
      // If we couldn't get the email from the ID token, try the Gmail API
      if (userEmail === 'unknown@example.com') {
        try {
          const gmail = google.gmail({ version: 'v1', auth });
          const profile = await gmail.users.getProfile({ userId: 'me' });
          if (profile.data.emailAddress) {
            userEmail = profile.data.emailAddress;
            console.log('Email extracted from Gmail API:', userEmail);
          }
        } catch (gmailError) {
          console.error('Error fetching email from Gmail API:', gmailError);
        }
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
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                margin-top: 50px;
              }
              .success {
                color: green;
                font-size: 24px;
                margin-bottom: 20px;
              }
              .message {
                margin-bottom: 30px;
              }
              .email {
                font-weight: bold;
                color: #4285f4;
              }
              .button {
                background-color: #4285f4;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
              }
            </style>
          </head>
          <body>
            <div class="success">✓ Authentication Successful</div>
            <div class="message">You have successfully authenticated with Google.</div>
            <div class="message">Account: <span class="email">${userEmail}</span></div>
            <div class="message">Your tokens have been saved to the database.</div>
          <a href ="http://localhost:3000/dashboard"><button class="button">Back to dashboard</button></a>
          </body>
        </html>
        `,
        {
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    } catch (tokenError: any) {
      console.error('Token exchange error:', tokenError);
      
      // Handle invalid_grant error specifically
      if (tokenError.message && tokenError.message.includes('invalid_grant')) {
        return new NextResponse(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Error</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  text-align: center;
                  margin-top: 50px;
                }
                .error {
                  color: red;
                  font-size: 24px;
                  margin-bottom: 20px;
                }
                .message {
                  margin-bottom: 30px;
                }
                .button {
                  background-color: #4285f4;
                  color: white;
                  padding: 10px 20px;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 16px;
                }
              </style>
            </head>
            <body>
              <div class="error">⚠️ Authentication Error</div>
              <div class="message">The authorization code has expired or already been used.</div>
              <div class="message">Please try authenticating again.</div>
              <button class="button" onclick="window.close()">Close Window</button>
            </body>
          </html>
          `,
          {
            headers: {
              'Content-Type': 'text/html',
            },
          }
        );
      }
      
      return NextResponse.json({ error: tokenError.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Auth callback failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}