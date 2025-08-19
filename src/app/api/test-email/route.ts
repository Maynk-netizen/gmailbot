import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/helpers/mailer";

export async function POST(request: NextRequest) {
    console.log("🧪 Test email route called");
    
    try {
        const { to, subject, message } = await request.json();
        
        console.log("🧪 Test email params:", { to, subject, message });
        
        const result = await sendEmail({
            email: to,
            subject: subject || "Test Email",
            reply: message || "<h1>Test Email</h1><p>This is a test email from your Gmail bot!</p>",
            tomail: "mayank642work@gmail.com"
        });
        
        return NextResponse.json({
            success: true,
            message: "Email sent successfully",
            result: result
        });
        
    } catch (error) {
        console.error("🧪 Test email error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
