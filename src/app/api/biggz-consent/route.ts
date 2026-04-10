import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendTelegram(chatId: string, text: string) {
    try {
        const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "HTML",
            }),
        });
        if (!response.ok) {
            console.error(`Telegram API error for ${chatId}:`, await response.text());
        }
    } catch (err) {
        console.error(`Fetch error for Telegram ID ${chatId}:`, err);
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        
        // Build readable message for Telegram
        const messageLines = [
            `🏠 <b>New Biggz Summer Fun Consent Form</b>`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `<b>Child:</b> ${data.childName} (${data.childAge})`,
            `<b>Parent:</b> ${data.parentName}`,
            `<b>Phone:</b> ${data.phone}`,
            `<b>Email:</b> ${data.email}`,
            `<b>Address:</b> ${data.address}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `<b>Attendance:</b> ${data.attendance}`,
            `<b>Activities:</b> ${data.activities?.join(", ") || "None selected"}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `<b>Emergency Contact:</b> ${data.emergencyName} (${data.emergencyRelationship})`,
            `<b>Emergency Phone:</b> ${data.emergencyPhone}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `<b>Medical Info:</b> ${data.medicalInfo || "None"}`,
            `<b>Dietary:</b> ${data.dietary || "None"}`,
            `<b>GP:</b> ${data.gpName} (${data.gpPhone})`,
            `<b>NHS No:</b> ${data.nhsNumber || "Not provided"}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `<b>Safeguarding Ack:</b> ${data.safeguardingConsent ? "✅ Yes" : "❌ No"}`,
            `<b>Photo Consent:</b> ${data.photoConsent}`,
            `<b>Declaration:</b> ${data.declarationName} on ${data.declarationDate}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `<i>Submitted via holditdown.uk</i>`
        ];

        const telegramMessage = messageLines.join("\n");

        // Send to all admin IDs configured in the environment
        const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        if (adminIds.length > 0) {
            await Promise.all(adminIds.map((id) => sendTelegram(id, telegramMessage)));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Biggz form error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
