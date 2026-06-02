import { NextRequest, NextResponse } from "next/server";
import { saveFormSubmission } from "@/lib/form-submissions";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendTelegram(chatId: string, text: string) {
    try {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "HTML",
            }),
        });
    } catch (err) {
        console.error(`Telegram error for ${chatId}:`, err);
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        if (!data.childName?.trim() || !data.parentName?.trim() || !data.phone?.trim() || !data.email?.trim()) {
            return NextResponse.json({ error: "Required registration details are missing." }, { status: 400 });
        }

        const savedSubmission = await saveFormSubmission({
            formType: "little-roots-registration",
            sourcePath: "/little-roots",
            payload: data,
            request,
            contactName: data.parentName,
            contactEmail: data.email,
            contactPhone: data.phone,
            subject: "Little Roots registration",
        });

        if (!savedSubmission.saved) {
            return NextResponse.json({ error: "Submission storage is temporarily unavailable." }, { status: 503 });
        }
        
        const messageLines = [
            `🌱 <b>New Little Roots Registration</b>`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `<b>Child:</b> ${data.childName} (${data.childAge})`,
            `<b>Parent/Carer:</b> ${data.parentName}`,
            `<b>Phone:</b> ${data.phone}`,
            `<b>Email:</b> ${data.email}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `<b>Medical/Allergies:</b> ${data.medicalInfo || "None"}`,
            `<b>Photo Consent:</b> ${data.photoConsent ? "✅ Yes" : "❌ No"}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `<i>Submitted via holditdown.uk/little-roots</i>`
        ];

        const telegramMessage = messageLines.join("\n");
        const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(id => id.trim()).filter(Boolean);

        if (adminIds.length > 0) {
            await Promise.all(adminIds.map(id => sendTelegram(id, telegramMessage)));
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Submission failed" }, { status: 500 });
    }
}
