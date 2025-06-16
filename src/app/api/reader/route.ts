import { NextRequest, NextResponse } from "next/server";
import { connectDB } from '@/helpers/db';
import GoogleUser from '@/models/googleuser';
import jwt from 'jsonwebtoken';
import { google, Auth } from "googleapis";
import { MongoClient } from 'mongodb';


import axios from 'axios';
import { Document } from 'mongoose';

import { gmail_v1 } from "googleapis";

// MongoDB connection for OAuth tokens
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'gmail_bot';
const TOKENS_COLLECTION = 'oauth_tokens';


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
}

interface GmailMessage {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: Array<{
      name: string;
      value: string;
    }>;
  };
}

interface TargetEmailMessage {
  email: string;
  messageId: string;
  subject: string;
  snippet: string;
  date: Date;
  isRead: boolean;
  threadId: string;
  labelIds: string[];
  fromHeader: string;
  toHeader: string;
}

interface IGoogleUser {
  email: string;
  targetEmails: string[];
  targetEmailMessages: TargetEmailMessage[];
}

interface GoogleUserDocument extends Document, IGoogleUser {}

interface GmailHeader {
  name: string;
  value: string;
}

// Connect to MongoDB for OAuth tokens
async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db(DB_NAME);
}

// Load credentials from credentials.json
// async function getCredentials() {
//   try {
//     const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
//     const credentials = JSON.parse(content);
//     let client_id, client_secret, redirect_uris;

//     if (credentials.installed) {
//       client_id = credentials.installed.client_id;
//       client_secret = credentials.installed.client_secret;
//       redirect_uris = credentials.installed.redirect_uris;
//     } else if (credentials.web) {
//       client_id = credentials.web.client_id;
//       client_secret = credentials.web.client_secret;
//       redirect_uris = credentials.web.redirect_uris;
//     } else {
//       throw new Error('Unsupported credentials format');
//     }

//     const redirect_uri = Array.isArray(redirect_uris) ? redirect_uris[0] : 'http://localhost:3000/oauth2callback';
//     return { client_id, client_secret, redirect_uri };
//   } catch (err: any) {
//     throw new Error(`Failed to load credentials: ${err.message}`);
//   }
// }

// Load OAuth2 client for the authenticated user
async function loadUserOAuth2Client(userEmail: string) {
  try {
    const db = await connectToMongoDB();
    const tokensCollection = db.collection<TokenData>(TOKENS_COLLECTION);
    
    const tokenData = await tokensCollection.findOne({ email: userEmail });
    
    if (!tokenData) {
      throw new Error(`No OAuth tokens found for user: ${userEmail}`);
    }
    
    const { client_id, client_secret, redirect_uri, tokens } = tokenData;
    
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
  } catch (err) {
    console.error('Error loading OAuth2 client:', err);
    throw err;
  }
}

// Get authenticated user from JWT token
async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";
  const decoded = jwt.verify(token, JWT_SECRET) as { 
    id: string;
    email: string;
    username: string;
  };
  
  return decoded;
}

// Fetch emails from Gmail API
async function fetchEmailsFromGmail(auth: Auth.OAuth2Client, query: string = '', maxResults: number = 50): Promise<GmailMessage[]> {
  const gmail = google.gmail({ version: 'v1', auth });
  
  try {
    // List messages with query
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: maxResults,
    });

    if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
      return [];
    }

    // Fetch full message details for each message
    const messages = await Promise.all(
      listResponse.data.messages.map(async (message: gmail_v1.Schema$Message) => {
        if (!message.id) return null;
        
        try {
          const messageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });
          
          return messageData.data;
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
          return null;
        }
      })
    );

    return messages.filter((message): message is GmailMessage => message !== null);
  } catch (error) {
    console.error('Error fetching emails from Gmail:', error);
    throw error;
  }
}

// Extract email address from header value
function extractEmailFromHeader(headerValue: string): string {
  if (!headerValue) return '';
  
  // Try to match email in angle brackets: "Name <email@example.com>"
  const emailMatch = headerValue.match(/<([^>]+)>/);
  if (emailMatch) {
    return emailMatch[1].toLowerCase();
  }
  
  // Try to match standalone email: "email@example.com"
  const standaloneEmailMatch = headerValue.match(/([^\s]+@[^\s]+)/);
  if (standaloneEmailMatch) {
    return standaloneEmailMatch[1].toLowerCase();
  }
  
  return headerValue.toLowerCase();
}

// Process and store emails from target addresses
async function processAndStoreEmails(userEmail: string, messages: GmailMessage[], targetEmails: string[]) {
  try {
    await connectDB();
    const user = await GoogleUser.findOne({ email: userEmail }) as GoogleUserDocument;
    
    if (!user) {
      throw new Error('User not found in database');
    }

    let newMessagesCount = 0;
    const targetEmailsLower = targetEmails.map(email => email.toLowerCase());

    for (const message of messages) {
      if (!message || !message.payload || !message.id) continue;

      // Extract email headers
      const headers = message.payload.headers || [];
      const fromHeader = headers.find((h: GmailHeader) => h.name === 'From')?.value || '';
      const subjectHeader = headers.find((h: GmailHeader) => h.name === 'Subject')?.value || '';
      const dateHeader = headers.find((h: GmailHeader) => h.name === 'Date')?.value || '';
      const toHeader = headers.find((h: GmailHeader) => h.name === 'To')?.value || '';
      // Extract sender email
      const senderEmail = extractEmailFromHeader(fromHeader);
      
      // Check if sender is in target emails
      if (!targetEmailsLower.includes(senderEmail)) {
        continue;
      }

      // Check if message already exists
      const messageExists = user.targetEmailMessages?.some(
        (msg: TargetEmailMessage) => msg.messageId === message.id
      );

      if (!messageExists) {
        // Parse date
        let messageDate = new Date();
        if (dateHeader) {
          const parsedDate = new Date(dateHeader);
          if (!isNaN(parsedDate.getTime())) {
            messageDate = parsedDate;
          }
        }

        // Add new message
        const newMessage: TargetEmailMessage = {
          email: senderEmail,
          messageId: message.id,
          subject: subjectHeader,
          snippet: message.snippet || '',
          date: messageDate,
          isRead: false,
          threadId: message.threadId || '',
          labelIds: message.labelIds || [],
          fromHeader: fromHeader,
          toHeader: toHeader
        };

        user.targetEmailMessages.push(newMessage);
        newMessagesCount++;
        const senderemail = newMessage.email;
        const snippet = newMessage.snippet||'';
        const subject = newMessage.subject||'';
        
        await axios.post(`http://localhost:3000/api/ai`,{
          senderemail:senderemail,
          snippet:snippet,
          subject:subject,
          toHeader:toHeader,
          fromHeader: fromHeader,
        });
      }
    }

    // Save user if new messages were added
    if (newMessagesCount > 0) {
      await user.save();
    }

    return {
      totalProcessed: messages.length,
      newMessages: newMessagesCount,
      targetEmailsCount: targetEmails.length
    };

  } catch (error) {
    console.error('Error processing and storing emails:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    console.log(`Processing reply route for user: ${authenticatedUser.email}`);

    // Connect to main database and get user
    await connectDB();
    const user = await GoogleUser.findOne({ email: authenticatedUser.email }) as GoogleUserDocument;
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.targetEmails || user.targetEmails.length === 0) {
      return NextResponse.json(
        { 
          error: 'No target emails configured',
          message: 'Please add target emails to your profile first'
        },
        { status: 400 }
      );
    }

    // Load OAuth2 client for the user
    const auth = await loadUserOAuth2Client(authenticatedUser.email);

    if (!auth.credentials || !auth.credentials.access_token) {
      return NextResponse.json(
        { 
          error: 'OAuth authentication required',
          message: 'Please authenticate with Google first'
        },
        { status: 401 }
      );
    }

    // Parse request body for optional parameters
    const maxResults = 1;
    const daysBack = 1;

    // Create query to fetch emails from target addresses within date range
    const targetEmailsQuery = user.targetEmails
      .map((email: string) => `from:${email}`)
      .join(' OR ');
    
    // Add date filter (last N days)
    const dateFilter = `newer_than:${daysBack}d`;
    const fullQuery = `(${targetEmailsQuery}) AND ${dateFilter}`;

    console.log(`Fetching emails with query: ${fullQuery}`);

    // Fetch emails from Gmail
    const messages = await fetchEmailsFromGmail(auth, fullQuery, maxResults);
    console.log(`Fetched ${messages.length} messages from Gmail`);

    // Process and store emails
    const result = await processAndStoreEmails(
      authenticatedUser.email,
      messages,
      user.targetEmails
    );

    console.log(`Processing complete:`, result);

    return NextResponse.json({
      success: true,
      message: 'Emails processed successfully',
      data: {
        ...result,
        query: fullQuery,
        userEmail: authenticatedUser.email
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Reply route failed:', error);
    
    // Handle specific error types
    if (error instanceof Error && error.message.includes('No authentication token')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes('No OAuth tokens found')) {
      return NextResponse.json(
        { 
          error: 'Gmail authentication required',
          message: 'Please authenticate with Gmail first'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve stored target email messages
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    
    // Connect to database
    await connectDB();
    const user = await GoogleUser.findOne({ email: authenticatedUser.email }) as GoogleUserDocument;
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const isRead = url.searchParams.get('isRead');
    const email = url.searchParams.get('email');

    // Filter messages
    let filteredMessages = user.targetEmailMessages || [];
    
    if (isRead !== null) {
      const readFilter = isRead === 'true';
      filteredMessages = filteredMessages.filter((msg: TargetEmailMessage) => msg.isRead === readFilter);
    }
    
    if (email) {
      filteredMessages = filteredMessages.filter((msg: TargetEmailMessage) => 
        msg.email.toLowerCase().includes(email.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filteredMessages.sort((a: TargetEmailMessage, b: TargetEmailMessage) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        messages: paginatedMessages,
        pagination: {
          page,
          limit,
          total: filteredMessages.length,
          totalPages: Math.ceil(filteredMessages.length / limit)
        },
        targetEmails: user.targetEmails || []
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('GET reply route failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to mark messages as read/unread
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    
    // Parse request body
    const body = await request.json();
    const { messageId, isRead } = body;

    if (!messageId || typeof isRead !== 'boolean') {
      return NextResponse.json(
        { error: 'messageId and isRead (boolean) are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();
    const user = await GoogleUser.findOne({ email: authenticatedUser.email }) as GoogleUserDocument;
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find and update the message
    const messageIndex = user.targetEmailMessages.findIndex(
      (msg: TargetEmailMessage) => msg.messageId === messageId
    );

    if (messageIndex === -1) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    user.targetEmailMessages[messageIndex].isRead = isRead;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Message marked as ${isRead ? 'read' : 'unread'}`,
      data: {
        messageId,
        isRead
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('PUT reply route failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}