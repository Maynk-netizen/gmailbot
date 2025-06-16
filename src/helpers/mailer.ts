import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface EmailParams {
    email: string;
    subject: string;
    reply: string;
}

export const sendEmail = async ({ email, subject, reply }: EmailParams) => {
    try {
        // Configure Gmail transporter
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER, // Your Gmail address
                pass: process.env.GMAIL_PASSWORD, // Your Gmail app password
            },
        });

        const mailOptions = {
            from: process.env.GMAIL_USER, // Sender address
            to: email, // Recipient address
            subject: subject,
            html: reply,
        };

        const mailResponse = await transport.sendMail(mailOptions);
        console.log(mailResponse);

        return mailResponse;
    } catch (error) {
        return NextResponse.json({ error });
    }
};