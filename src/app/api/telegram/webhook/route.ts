import { NextRequest, NextResponse } from "next/server";
import { parseCommand } from "@/lib/openrouter";
import { supabaseAdmin } from "@/lib/supabase";
import { executeCMSAction } from "@/lib/cms-actions";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// Send a message via Telegram Bot API
async function sendTelegram(chatId: number, text: string, parseMode = "HTML") {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: parseMode,
        }),
    });
}

// Send a message with inline keyboard buttons
async function sendTelegramWithButtons(
    chatId: number,
    text: string,
    buttons: { text: string; callback_data: string }[][],
    parseMode = "HTML"
) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: parseMode,
            reply_markup: { inline_keyboard: buttons },
        }),
    });
}

// Answer a callback query (acknowledge button press)
async function answerCallback(callbackId: string, text?: string) {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            callback_query_id: callbackId,
            text: text || "",
        }),
    });
}

// Check if user is an authorized admin
function isAdmin(userId: number): boolean {
    const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    return adminIds.includes(String(userId));
}

// Download a Telegram file and upload to Supabase storage
async function handlePhoto(fileId: string): Promise<string | null> {
    if (!supabaseAdmin) return null;
    try {
        // Get file path from Telegram
        const fileResp = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
        const fileData = await fileResp.json();
        const filePath = fileData.result?.file_path;
        if (!filePath) return null;

        // Download file
        const downloadUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
        const fileResponse = await fetch(downloadUrl);
        const buffer = await fileResponse.arrayBuffer();

        // Upload to Supabase Storage
        const ext = filePath.split(".").pop() || "jpg";
        const filename = `telegram/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from("website-images")
            .upload(filename, new Uint8Array(buffer), {
                contentType: `image/${ext}`,
                upsert: false,
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from("website-images")
            .getPublicUrl(filename);

        return urlData.publicUrl;
    } catch (error) {
        console.error("Photo upload error:", error);
        return null;
    }
}

// Revalidate site via internal API
async function triggerRevalidation(): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    try {
        const res = await fetch(`${baseUrl}/api/revalidate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.CMS_API_SECRET}`,
            },
        });
        return res.ok;
    } catch {
        return false;
    }
}

// Format result for Telegram display
function formatResult(action: Record<string, unknown>, _result: unknown): string {
    const act = action.action as string;

    switch (act) {
        case "update_section_field":
            return `✅ Updated <b>${action.section}.${action.field}</b>`;
        case "update_section":
            return `✅ Updated entire <b>${action.section}</b> section`;
        case "add_team_member":
            return `✅ Added team member: <b>${action.name}</b>`;
        case "remove_team_member":
            return `✅ Removed team member: <b>${action.name}</b>`;
        case "update_team_member":
            return `✅ Updated team member: <b>${action.name}</b>`;
        case "add_gallery_image":
            return `✅ Added gallery image: <b>${action.caption || "New image"}</b>`;
        case "remove_gallery_image":
            return `✅ Removed gallery image: <b>${action.caption}</b>`;
        case "add_program":
            return `✅ Added program: <b>${action.title}</b>`;
        case "update_program":
            return `✅ Updated program: <b>${action.title}</b>`;
        case "remove_program":
            return `✅ Removed program: <b>${action.title}</b>`;
        case "add_event":
            return `✅ Added event: <b>${(action.event as Record<string, string>)?.title || "New event"}</b>`;
        case "update_event":
            return `✅ Updated event: <b>${action.slug}</b>`;
        case "update_stat":
            return `✅ Updated stat: <b>${action.label}</b> → ${action.value}`;
        case "add_initiative":
            return `✅ Added initiative: <b>${action.title}</b>`;
        case "remove_initiative":
            return `✅ Removed initiative: <b>${action.title}</b>`;
        case "get_status": {
            const counts = _result as Record<string, number>;
            const lines = Object.entries(counts)
                .map(([table, count]) => `  • ${table}: ${count}`)
                .join("\n");
            return `📊 <b>CMS Status</b>\n\n${lines}`;
        }
        default:
            return `✅ Action completed: ${act}`;
    }
}

export async function POST(request: NextRequest) {
    try {
        const update = await request.json();

        // Handle callback queries (inline button presses)
        if (update.callback_query) {
            const cb = update.callback_query;
            const chatId = cb.message?.chat?.id;
            const userId = cb.from?.id;
            const data = cb.data;

            if (!chatId || !userId || !isAdmin(userId)) {
                await answerCallback(cb.id, "Not authorized");
                return NextResponse.json({ ok: true });
            }

            await answerCallback(cb.id);

            if (data === "cms_deploy") {
                await sendTelegram(chatId, "🚀 Refreshing website...");
                const ok = await triggerRevalidation();
                if (ok) {
                    await sendTelegram(chatId, "✅ <b>Website is live!</b>\n\n🌐 <a href=\"https://www.holditdowncic.uk\">www.holditdowncic.uk</a>\n\nAll changes are now visible.");
                } else {
                    await sendTelegram(chatId, "❌ Refresh failed. Try /deploy manually.");
                }
            } else if (data === "cms_revert") {
                await sendTelegram(chatId, "⏳ Reverting last change...");
                const result = await executeCMSAction({ action: "undo" });
                if (result.success) {
                    await sendTelegramWithButtons(
                        chatId,
                        `✅ Change has been reverted.\n\n🔄 Ready to deploy.`,
                        [[{ text: "🚀 Deploy Now", callback_data: "cms_deploy" }]]
                    );
                } else {
                    await sendTelegram(chatId, `❌ ${result.error || "Unknown error"}`);
                }
            }

            return NextResponse.json({ ok: true });
        }

        const message = update.message;
        if (!message) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id;
        const userId = message.from?.id;
        const text = message.text || message.caption || "";

        // Auth check
        if (!userId || !isAdmin(userId)) {
            await sendTelegram(chatId, "⛔ You are not authorized to use this bot.");
            return NextResponse.json({ ok: true });
        }

        // Handle /start
        if (text === "/start") {
            await sendTelegram(
                chatId,
                `🤖 <b>Hold It Down CMS Bot</b>\n\nSend me natural language commands to manage the website content.\n\n<b>Examples:</b>\n• "Change the hero heading to Welcome Home"\n• "Add team member John Smith as Lead Developer"\n• "Update the about section heading"\n• "Add a new event called Spring Gala on March 15"\n• "Change the cookie banner message to We only use essential cookies"\n• "Disable the cookie banner"\n• "Undo" — reverts the last change\n• "Show status"\n\n📸 <b>Image uploads:</b> Send a photo with a caption like "Add this to gallery as Community Day" or "Use this as the hero image"\n\n💡 Just type what you want to change!`
            );
            return NextResponse.json({ ok: true });
        }

        // Handle /help
        if (text === "/help") {
            await sendTelegram(
                chatId,
                `📖 <b>Available Commands</b>\n\n<b>Quick commands:</b>\n/status — check CMS table counts\n/cookies — cookie consent analytics\n/undo — revert last change\n/deploy — refresh site with latest changes\n/help — show this message\n\n<b>Sections:</b> hero, about, cta, contact, support, gallery, programs, cookie_banner\n\n<b>Data:</b> team members, gallery images, programs, events, stats, initiatives\n\n<b>Actions:</b>\n• Update text fields\n• Add/remove items\n• Upload images (send photo + caption)\n• Enable/disable cookie banner\n\n<b>Tip:</b> Just describe what you want to change in plain English!`
            );
            return NextResponse.json({ ok: true });
        }

        // Handle /undo
        if (text === "/undo") {
            await sendTelegram(chatId, "⏳ Reverting last change...");
            const result = await executeCMSAction({ action: "undo" });
            if (result.success) {
                const msg = (result.result as Record<string, string>)?.message || "Change reverted.";
                await sendTelegram(chatId, `${msg}\n\n🌐 The website will update within 60 seconds.`);
            } else {
                await sendTelegram(chatId, `❌ ${result.error || "Unknown error"}`);
            }
            return NextResponse.json({ ok: true });
        }

        // Handle /status
        if (text === "/status") {
            await sendTelegram(chatId, "📊 Fetching status...");
            const result = await executeCMSAction({ action: "get_status" });
            if (result.success) {
                const counts = result.result as Record<string, number>;
                const lines = Object.entries(counts)
                    .map(([table, count]) => `  • ${table}: ${count}`)
                    .join("\n");
                await sendTelegram(chatId, `📊 <b>CMS Status</b>\n\n${lines}`);
            } else {
                await sendTelegram(chatId, `❌ ${result.error || "Unknown error"}`);
            }
            return NextResponse.json({ ok: true });
        }

        // Handle /deploy (revalidate all pages so changes go live immediately)
        if (text === "/deploy") {
            await sendTelegram(chatId, "🚀 Refreshing website cache...");
            const ok = await triggerRevalidation();
            if (ok) {
                await sendTelegram(chatId, "✅ <b>Website refreshed!</b>\n\nAll pages have been revalidated. Changes are now live at https://www.holditdowncic.uk");
            } else {
                await sendTelegram(chatId, "❌ Refresh failed. Please try again.");
            }
            return NextResponse.json({ ok: true });
        }

        // Handle /cookies — show cookie consent analytics
        if (text === "/cookies") {
            if (!supabaseAdmin) {
                await sendTelegram(chatId, "❌ Database not configured.");
                return NextResponse.json({ ok: true });
            }
            await sendTelegram(chatId, "🍪 Fetching cookie analytics...");

            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

            // Total all-time
            const { count: totalAccepted } = await supabaseAdmin
                .from("cookie_consent_log")
                .select("*", { count: "exact", head: true })
                .eq("action", "accepted");
            const { count: totalDeclined } = await supabaseAdmin
                .from("cookie_consent_log")
                .select("*", { count: "exact", head: true })
                .eq("action", "declined");

            // Today
            const { count: todayAccepted } = await supabaseAdmin
                .from("cookie_consent_log")
                .select("*", { count: "exact", head: true })
                .eq("action", "accepted")
                .gte("created_at", `${today}T00:00:00Z`);
            const { count: todayDeclined } = await supabaseAdmin
                .from("cookie_consent_log")
                .select("*", { count: "exact", head: true })
                .eq("action", "declined")
                .gte("created_at", `${today}T00:00:00Z`);

            const total = (totalAccepted || 0) + (totalDeclined || 0);
            const todayTotal = (todayAccepted || 0) + (todayDeclined || 0);
            const acceptRate = total > 0 ? Math.round(((totalAccepted || 0) / total) * 100) : 0;

            await sendTelegram(
                chatId,
                `🍪 <b>Cookie Consent Analytics</b>\n\n` +
                `<b>📅 Today:</b>\n` +
                `  ✅ Accepted: ${todayAccepted || 0}\n` +
                `  ❌ Declined: ${todayDeclined || 0}\n` +
                `  📊 Total: ${todayTotal}\n\n` +
                `<b>📈 All Time:</b>\n` +
                `  ✅ Accepted: ${totalAccepted || 0}\n` +
                `  ❌ Declined: ${totalDeclined || 0}\n` +
                `  📊 Total: ${total}\n` +
                `  🎯 Accept Rate: ${acceptRate}%`
            );
            return NextResponse.json({ ok: true });
        }

        // Handle photo uploads
        let imageUrl: string | undefined;
        if (message.photo && message.photo.length > 0) {
            // Get highest resolution photo
            const largestPhoto = message.photo[message.photo.length - 1];
            await sendTelegram(chatId, "📤 Uploading image...");
            const url = await handlePhoto(largestPhoto.file_id);
            if (url) {
                imageUrl = url;
            } else {
                await sendTelegram(chatId, "❌ Failed to upload image. Please try again.");
                return NextResponse.json({ ok: true });
            }
        }

        // Parse command via OpenRouter
        if (!text && !imageUrl) {
            await sendTelegram(chatId, "💬 Please send a text command or a photo with a caption.");
            return NextResponse.json({ ok: true });
        }

        await sendTelegram(chatId, "🔄 Processing your command...");

        const parsedAction = await parseCommand(text, imageUrl);

        if (parsedAction.action === "unknown") {
            await sendTelegram(
                chatId,
                `🤔 I couldn't understand that command.\n\n${parsedAction.message}\n\nTry rephrasing or type /help for examples.`
            );
            return NextResponse.json({ ok: true });
        }

        // Show what will be done
        await sendTelegram(
            chatId,
            `🎯 <b>Parsed action:</b> <code>${parsedAction.action}</code>\n\n<pre>${JSON.stringify(parsedAction, null, 2)}</pre>\n\n⏳ Executing...`
        );

        // Execute the action DIRECTLY (no HTTP round-trip)
        const result = await executeCMSAction(parsedAction as unknown as Record<string, unknown>);

        if (result.success) {
            const msg = formatResult(parsedAction as unknown as Record<string, unknown>, result.result);
            await sendTelegramWithButtons(
                chatId,
                msg,
                [
                    [
                        { text: "🚀 Deploy Now", callback_data: "cms_deploy" },
                        { text: "↩️ Revert Change", callback_data: "cms_revert" },
                    ],
                ]
            );
        } else {
            await sendTelegram(chatId, `❌ <b>Error:</b> ${result.error}\n\nPlease try again or rephrase your command.`);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Telegram webhook error:", error);
        return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }
}
