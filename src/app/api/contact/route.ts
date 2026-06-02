import { NextRequest, NextResponse } from "next/server";
import { saveFormSubmission } from "@/lib/form-submissions";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendTelegram(chatId: string, text: string) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
        }),
    });
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, subject, message } = body;

        // Validate
        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            return NextResponse.json(
                { error: "All fields are required." },
                { status: 400 }
            );
        }

        if (!isValidEmail(email.trim())) {
            return NextResponse.json(
                { error: "Please enter a valid email address." },
                { status: 400 }
            );
        }

        const trimmedSubmission = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || "",
            subject: subject.trim(),
            message: message.trim(),
        };

        const savedSubmission = await saveFormSubmission({
            formType: "contact",
            sourcePath: "/contact",
            payload: trimmedSubmission,
            request,
            contactName: trimmedSubmission.name,
            contactEmail: trimmedSubmission.email,
            contactPhone: trimmedSubmission.phone,
            subject: trimmedSubmission.subject,
        });

        if (!savedSubmission.saved) {
            return NextResponse.json(
                { error: "Contact form is temporarily unavailable. Please try again shortly." },
                { status: 503 }
            );
        }

        // Build Telegram message
        const telegramMessage = [
            `📩 <b>New Contact Form Submission</b>`,
            ``,
            `<b>Name:</b> ${trimmedSubmission.name}`,
            `<b>Email:</b> ${trimmedSubmission.email}`,
            trimmedSubmission.phone ? `<b>Phone:</b> ${trimmedSubmission.phone}` : null,
            `<b>Subject:</b> ${trimmedSubmission.subject}`,
            ``,
            `<b>Message:</b>`,
            trimmedSubmission.message,
            ``,
            `—`,
            `<i>Sent from holditdown.uk contact form</i>`,
        ].filter(Boolean).join("\n");

        // Send to all admin IDs
        const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        if (adminIds.length === 0) {
            console.error("No TELEGRAM_ADMIN_IDS configured");
        } else {
            await Promise.all(adminIds.map((id) => sendTelegram(id, telegramMessage)));
        }

        // Also send to OpenClaw bot
        try {
            const openclawToken = process.env.OPENCLAW_BOT_TOKEN;
            const openclawChatId = process.env.OPENCLAW_CHAT_ID;
            if (openclawToken && openclawChatId) {
                await fetch(`https://api.telegram.org/bot${openclawToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: openclawChatId,
                        text: telegramMessage,
                        parse_mode: "HTML",
                    }),
                });
            }
        } catch (openclawErr) {
            console.error("OpenClaw contact notification error:", openclawErr);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
