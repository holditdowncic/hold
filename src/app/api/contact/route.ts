import { NextRequest, NextResponse } from "next/server";

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

        // Build Telegram message
        const telegramMessage = [
            `📩 <b>New Contact Form Submission</b>`,
            ``,
            `<b>Name:</b> ${name.trim()}`,
            `<b>Email:</b> ${email.trim()}`,
            phone?.trim() ? `<b>Phone:</b> ${phone.trim()}` : null,
            `<b>Subject:</b> ${subject.trim()}`,
            ``,
            `<b>Message:</b>`,
            message.trim(),
            ``,
            `—`,
            `<i>Sent from holditdowncic.uk contact form</i>`,
        ].filter(Boolean).join("\n");

        // Send to all admin IDs
        const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        if (adminIds.length === 0) {
            console.error("No TELEGRAM_ADMIN_IDS configured");
            return NextResponse.json(
                { error: "Contact form is temporarily unavailable." },
                { status: 503 }
            );
        }

        await Promise.all(adminIds.map((id) => sendTelegram(id, telegramMessage)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
