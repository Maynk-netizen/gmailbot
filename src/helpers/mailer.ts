import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface EmailParams {
    email: string;
    subject: string;
    reply: string;
    tomail:string;
}

export const sendEmail = async ({ email, subject, reply ,tomail}: EmailParams) => {
    try {
        // Check if required environment variables are set
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
            console.error("Missing Gmail credentials: GMAIL_USER or GMAIL_PASSWORD environment variables not set");
            throw new Error("Gmail credentials not configured");
        }

        console.log("Configuring Gmail transporter...");
        // Configure Gmail transporter
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER, // Your Gmail address
              
                pass: process.env.GMAIL_PASSWORD, // Your Gmail app password
            },
        });

        const mailOptions = {
            from: `"${tomail.split('@')[0]}" <${process.env.GMAIL_USER}>`, // Custom From name with original sender email
            to: email, // Recipient address
            subject: subject,
            html: reply,
        };

        console.log(`Sending email to: ${email}, from: ${process.env.GMAIL_USER}, subject: ${subject}`);
        
        const mailResponse = await transport.sendMail(mailOptions);
        console.log("Email sent successfully:", mailResponse);

        return mailResponse;
    } catch (error) {
        console.error("Error in sendEmail function:", error);
        throw error; // Re-throw the error instead of returning NextResponse
    }
};