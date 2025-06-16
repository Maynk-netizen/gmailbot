import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import GoogleUser from "@/models/googleuser";
import { connectDB } from '@/helpers/db';

// Define types
interface JwtPayload {
  id: string;
  email: string;
  username: string;
}

interface Reply {
  email: string;
  messageId: string;
  reply: string;
  subject: string;
  snippet: string;
  date: Date;
  isRead: boolean;
}

interface GoogleUserDocument {
  replies: Reply[];
}

// GET endpoint to fetch replies
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Get the token from cookies
    const token = request.cookies.get('token')?.value || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const userId = decodedToken.id;

    // Find the user and get their replies
    const user = await GoogleUser.findById(userId).select('replies') as GoogleUserDocument | null;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Sort replies by date (newest first)
    const sortedReplies = user.replies.sort((a: Reply, b: Reply) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      success: true,
      replies: sortedReplies
    });

  } catch (error) {
    console.error('Error fetching replies:', error);
    
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to add new replies
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Get the token from cookies
    const token = request.cookies.get('token')?.value || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const userId = decodedToken.id;

    // Get the reply data from request body
    const body = await request.json();
    const { email, messageId, reply, subject, snippet } = body;

    // Validate required fields
    if (!email || !messageId || !reply) {
      return NextResponse.json(
        { error: 'Missing required fields: email, messageId, reply' },
        { status: 400 }
      );
    }

    // Create new reply object
    const newReply: Reply = {
      email,
      messageId,
      reply,
      subject: subject || 'No Subject',
      snippet: snippet || '',
      date: new Date(),
      isRead: false
    };

    // Find user and add the new reply
    const user = await GoogleUser.findByIdAndUpdate(
      userId,
      { 
        $push: { replies: newReply }
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reply added successfully',
      reply: newReply
    });

  } catch (error) {
    console.error('Error adding reply:', error);
    
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}