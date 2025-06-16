import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/helpers/db';
import GoogleUser from '@/models/googleuser';
import jwt from 'jsonwebtoken';

// Define EmailContext type
type EmailContext = {
  targetEmail: string;
  context: string;
};

// Define error type
interface ErrorWithMessage {
  message: string;
}

// GET endpoint to fetch email context
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    await connectDB();
    const user = await GoogleUser.findOne({ email: decoded.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetEmail = request.nextUrl.searchParams.get('targetEmail');
    if (!targetEmail) {
      return NextResponse.json({ error: 'targetEmail is required' }, { status: 400 });
    }

    const emailContext = user.emailContexts.find((ctx: EmailContext) => ctx.targetEmail === targetEmail);

    return NextResponse.json({ context: emailContext?.context || '' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST endpoint to save email context
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    const { targetEmail, context } = await request.json();

    if (!targetEmail || typeof context !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await connectDB();
    const user = await GoogleUser.findOne({ email: decoded.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update or add new context
    const existingContextIndex = user.emailContexts.findIndex((ctx: EmailContext) => ctx.targetEmail === targetEmail);

    if (existingContextIndex >= 0) {
      user.emailContexts[existingContextIndex].context = context;
    } else {
      user.emailContexts.push({ targetEmail, context });
    }

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
