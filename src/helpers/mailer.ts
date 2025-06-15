
import { NextRequest, NextResponse } from "next/server";

import nodemailer from "nodemailer";

export const sendEmail = async ({ email,subject,reply}: any) => {
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
        console.log(mailResponse)

        return mailResponse;
    } catch (error) {
        return NextResponse.json({ error });
    }
};