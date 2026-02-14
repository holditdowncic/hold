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

// Describe an action in plain English (shown while executing)
function describeAction(action: Record<string, unknown>): string {
    switch (action.action) {
        case "update_section_field":
            return `Updating <b>${action.field}</b> in the <b>${action.section}</b> section...`;
        case "update_section":
            return `Updating the entire <b>${action.section}</b> section...`;
        case "add_team_member":
            return `Adding <b>${action.name}</b> to the team...`;
        case "remove_team_member":
            return `Removing <b>${action.name}</b> from the team...`;
        case "update_team_member":
            return `Updating <b>${action.name}</b>'s details...`;
        case "add_gallery_image":
            return `Adding image to the gallery...`;
        case "remove_gallery_image":
            return `Removing image from the gallery...`;
        case "add_program":
            return `Adding program: <b>${action.title}</b>...`;
        case "update_program":
            return `Updating program: <b>${action.title}</b>...`;
        case "remove_program":
            return `Removing program: <b>${action.title}</b>...`;
        case "add_event":
            return `Adding a new event...`;
        case "update_event":
            return `Updating event: <b>${action.slug}</b>...`;
        case "update_stat":
            return `Updating stat: <b>${action.label}</b>...`;
        case "add_initiative":
            return `Adding initiative: <b>${action.title}</b>...`;
        case "remove_initiative":
            return `Removing initiative: <b>${action.title}</b>...`;
        case "get_status":
            return `Fetching CMS status...`;
        case "undo":
            return `Reverting last change...`;
        default:
            return `Processing your request...`;
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
                `👋 <b>Welcome to Hold It Down CMS</b>\n\nJust tell me what you want to change on the website — in plain English.\n\n<b>💬 Try saying things like:</b>\n• Change the main heading to Welcome Home\n• Add a new team member called John\n• Add a new event for March 15\n• Undo my last change\n\n<b>📸 Upload photos:</b>\nSend a photo with a caption like:\n• Add this to the gallery\n• Use this as the hero image\n\n<b>⚡ Quick commands:</b>\n/help — see all commands\n/status — check what's in the CMS\n/undo — undo last change\n/deploy — push changes live\n\n💡 That's it — just type naturally!`
            );
            return NextResponse.json({ ok: true });
        }

        // Handle /help
        if (text === "/help") {
            await sendTelegram(
                chatId,
                `📖 <b>How to use this bot</b>\n\n<b>⚡ Quick Commands:</b>\n/status — what's in the CMS right now\n/undo — undo your last change\n/deploy — make changes live on the website\n/cookies — see cookie consent stats\n\n<b>✏️ What you can change:</b>\n• Hero section (heading, subtext, buttons)\n• About section\n• Team members (add, edit, remove)\n• Programmes (add, edit, remove)\n• Events (add, edit)\n• Gallery images\n• Stats & initiatives\n• Cookie banner\n\n<b>📸 Photos:</b>\nSend any photo with a short caption describing where to use it.\n\n<b>💡 Examples:</b>\n• Change hero heading to We Build Community\n• Add team member Sarah as Project Lead\n• Remove the event Spring Gala\n• Show status\n• Undo`
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

        // Show a simple human-readable summary of what we're doing
        const actionLabel = describeAction(parsedAction as unknown as Record<string, unknown>);
        await sendTelegram(chatId, `⏳ ${actionLabel}`);

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
