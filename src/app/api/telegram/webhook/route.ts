import { NextRequest, NextResponse } from "next/server";
import { parseCommand } from "@/lib/openrouter";
import { supabaseAdmin } from "@/lib/supabase";
import { executeCMSAction } from "@/lib/cms-actions";
import { transcribeVoice } from "@/lib/transcribe";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// ─── Telegram helpers ───

async function sendTelegram(chatId: number, text: string, parseMode = "HTML") {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });
}

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

async function answerCallback(callbackId: string, text?: string) {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackId, text: text || "" }),
    });
}

function isAdmin(userId: number): boolean {
    const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    return adminIds.includes(String(userId));
}

// ─── Photo upload ───

async function handlePhoto(fileId: string): Promise<string | null> {
    if (!supabaseAdmin) return null;
    try {
        const fileResp = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
        const fileData = await fileResp.json();
        const filePath = fileData.result?.file_path;
        if (!filePath) return null;

        const downloadUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
        const fileResponse = await fetch(downloadUrl);
        const buffer = await fileResponse.arrayBuffer();

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

        const { data: urlData } = supabaseAdmin.storage
            .from("website-images")
            .getPublicUrl(filename);

        return urlData.publicUrl;
    } catch (error) {
        console.error("Photo upload error:", error);
        return null;
    }
}

// ─── Revalidation ───

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

// ─── Human-readable descriptions ───

function describeAction(action: Record<string, unknown>): string {
    switch (action.action) {
        case "update_section_field":
            return `Update <b>${action.field}</b> in <b>${action.section}</b> section`;
        case "update_section":
            return `Update entire <b>${action.section}</b> section`;
        case "add_team_member":
            return `Add <b>${action.name}</b> to the team`;
        case "remove_team_member":
            return `Remove <b>${action.name}</b> from the team`;
        case "update_team_member":
            return `Update <b>${action.name}</b>'s details`;
        case "add_gallery_image":
            return `Add image to the gallery`;
        case "remove_gallery_image":
            return `Remove image from the gallery`;
        case "add_program":
            return `Add programme: <b>${action.title}</b>`;
        case "update_program":
            return `Update programme: <b>${action.title}</b>`;
        case "remove_program":
            return `Remove programme: <b>${action.title}</b>`;
        case "add_event":
            return `Add a new event`;
        case "update_event":
            return `Update event: <b>${action.slug}</b>`;
        case "update_stat":
            return `Update stat: <b>${action.label}</b> → ${action.value}`;
        case "add_initiative":
            return `Add initiative: <b>${action.title}</b>`;
        case "remove_initiative":
            return `Remove initiative: <b>${action.title}</b>`;
        default:
            return `${action.action}`;
    }
}

function formatSummary(action: Record<string, unknown>): string {
    // Build a short human-readable summary of what will change
    const lines: string[] = [];
    switch (action.action) {
        case "update_section_field":
            lines.push(`<b>Section:</b> ${action.section}`);
            lines.push(`<b>Field:</b> ${action.field}`);
            lines.push(`<b>New value:</b> ${action.value}`);
            break;
        case "update_section":
            lines.push(`<b>Section:</b> ${action.section}`);
            lines.push(`<b>Full content update</b>`);
            break;
        case "add_team_member":
            lines.push(`<b>Name:</b> ${action.name}`);
            if (action.role) lines.push(`<b>Role:</b> ${action.role}`);
            break;
        case "remove_team_member":
            lines.push(`<b>Name:</b> ${action.name}`);
            break;
        case "update_team_member":
            lines.push(`<b>Name:</b> ${action.name}`);
            if (action.updates) lines.push(`<b>Changes:</b> ${Object.keys(action.updates as object).join(", ")}`);
            break;
        case "add_program":
            lines.push(`<b>Title:</b> ${action.title}`);
            if (action.description) lines.push(`<b>Description:</b> ${(action.description as string).substring(0, 80)}...`);
            break;
        case "add_event": {
            const evt = action.event as Record<string, string> | undefined;
            if (evt?.title) lines.push(`<b>Title:</b> ${evt.title}`);
            if (evt?.date) lines.push(`<b>Date:</b> ${evt.date}`);
            break;
        }
        case "update_stat":
            lines.push(`<b>Stat:</b> ${action.label}`);
            lines.push(`<b>New value:</b> ${action.value}`);
            break;
        default:
            // Generic: show all non-action keys
            for (const [k, v] of Object.entries(action)) {
                if (k !== "action") lines.push(`<b>${k}:</b> ${v}`);
            }
    }
    return lines.join("\n");
}

// ─── Pending actions (confirmation flow) ───

async function storePendingAction(chatId: number, action: Record<string, unknown>, description: string): Promise<string | null> {
    if (!supabaseAdmin) return null;
    try {
        // Clean up old pending actions for this chat
        await supabaseAdmin
            .from("pending_cms_actions")
            .delete()
            .eq("chat_id", chatId);

        const { data, error } = await supabaseAdmin
            .from("pending_cms_actions")
            .insert({
                chat_id: chatId,
                action_data: action,
                description,
            })
            .select("id")
            .single();

        if (error) {
            console.error("Store pending action error:", error);
            return null;
        }
        return data.id;
    } catch (e) {
        console.error("Store pending action error:", e);
        return null;
    }
}

async function getPendingAction(actionId: string): Promise<{ chatId: number; action: Record<string, unknown> } | null> {
    if (!supabaseAdmin) return null;
    try {
        const { data, error } = await supabaseAdmin
            .from("pending_cms_actions")
            .select("chat_id, action_data")
            .eq("id", actionId)
            .single();

        if (error || !data) return null;
        return { chatId: data.chat_id, action: data.action_data };
    } catch {
        return null;
    }
}

async function deletePendingAction(actionId: string) {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from("pending_cms_actions").delete().eq("id", actionId);
}

// ─── Main webhook handler ───

export async function POST(request: NextRequest) {
    try {
        const update = await request.json();

        // ─── Callback queries (button presses) ───
        if (update.callback_query) {
            const cb = update.callback_query;
            const chatId = cb.message?.chat?.id;
            const userId = cb.from?.id;
            const data = cb.data as string;

            if (!chatId || !userId || !isAdmin(userId)) {
                await answerCallback(cb.id, "Not authorized");
                return NextResponse.json({ ok: true });
            }

            await answerCallback(cb.id);

            // ─── Confirm a pending change ───
            if (data.startsWith("cms_yes_")) {
                const actionId = data.replace("cms_yes_", "");
                const pending = await getPendingAction(actionId);

                if (!pending) {
                    await sendTelegram(chatId, "⚠️ This action has expired. Please send your command again.");
                    return NextResponse.json({ ok: true });
                }

                await sendTelegram(chatId, "🚀 Committing...");

                const result = await executeCMSAction(pending.action);
                await deletePendingAction(actionId);

                if (result.success) {
                    await sendTelegram(chatId, `✅ <b>Committed!</b>\n\n${describeAction(pending.action)}\n\n🌐 <a href="https://www.holditdowncic.uk">View Live Site</a>`);
                    // Auto-deploy
                    await sendTelegram(chatId, "🚀 Deploying... (~1-2 min)");
                    const deployed = await triggerRevalidation();
                    if (deployed) {
                        await sendTelegram(chatId, `✅ <b>Deployed!</b>\n\n🌐 <a href="https://www.holditdowncic.uk">View Live Site</a>`);
                    }
                } else {
                    await sendTelegram(chatId, `❌ <b>Error:</b> ${result.error}\n\nPlease try again.`);
                }
                return NextResponse.json({ ok: true });
            }

            // ─── Cancel a pending change ───
            if (data.startsWith("cms_no_")) {
                const actionId = data.replace("cms_no_", "");
                await deletePendingAction(actionId);
                await sendTelegram(chatId, "❌ Cancelled. No changes were made.");
                return NextResponse.json({ ok: true });
            }

            // ─── Deploy ───
            if (data === "cms_deploy") {
                await sendTelegram(chatId, "🚀 Deploying...");
                const ok = await triggerRevalidation();
                if (ok) {
                    await sendTelegram(chatId, "✅ <b>Deployed!</b>\n\n🌐 Changes are now live at <a href=\"https://www.holditdowncic.uk\">holditdowncic.uk</a>");
                } else {
                    await sendTelegram(chatId, "❌ Deploy failed. Try /deploy manually.");
                }
                return NextResponse.json({ ok: true });
            }

            // ─── Revert ───
            if (data === "cms_revert") {
                await sendTelegram(chatId, "⏳ Reverting...");
                const result = await executeCMSAction({ action: "undo" });
                if (result.success) {
                    const msg = (result.result as Record<string, string>)?.message || "Last change reverted.";
                    await sendTelegram(chatId, `✅ <b>Reverted:</b> ${msg}\n\n🌐 <a href="https://www.holditdowncic.uk">View Live Site</a>`);
                    // Auto-deploy
                    await sendTelegram(chatId, "🚀 Deploying... (~1-2 min)");
                    const deployed = await triggerRevalidation();
                    if (deployed) {
                        await sendTelegram(chatId, `✅ <b>Deployed!</b>\n\n🌐 <a href="https://www.holditdowncic.uk">View Live Site</a>`);
                    }
                } else {
                    await sendTelegram(chatId, `❌ ${result.error || "Nothing to undo."}`);
                }
                return NextResponse.json({ ok: true });
            }

            return NextResponse.json({ ok: true });
        }

        // ─── Regular messages ───
        const message = update.message;
        if (!message) return NextResponse.json({ ok: true });

        const chatId = message.chat.id;
        const userId = message.from?.id;
        let text = message.text || message.caption || "";

        if (!userId || !isAdmin(userId)) {
            await sendTelegram(chatId, "⛔ You are not authorized to use this bot.");
            return NextResponse.json({ ok: true });
        }

        // ─── /start ───
        if (text === "/start") {
            await sendTelegram(
                chatId,
                `👋 <b>Hold It Down CMS</b>\n\nJust tell me what you want to change — in plain English.\n\n📝 <b>Text:</b> "Update hero heading to: New headline"\n📸 <b>Photo:</b> Send image + caption to add it\n🎙️ <b>Voice:</b> Record a voice message with your command\n🔍 <b>Screenshot:</b> Send screenshot + what to change\n\n/status /undo /deploy /cookies /sections`
            );
            return NextResponse.json({ ok: true });
        }

        // ─── /help ───
        if (text === "/help") {
            await sendTelegram(
                chatId,
                `📖 <b>How to use this bot</b>\n\n<b>⚡ Quick Commands:</b>\n/status — what's in the CMS right now\n/sections — see all editable sections & fields\n/undo — undo your last change\n/deploy — make changes live on the website\n/cookies — see cookie consent stats\n\n<b>✏️ What you can change:</b>\n• Hero section (heading, subtext, buttons)\n• About section\n• Team members (add, edit, remove)\n• Programmes (add, edit, remove)\n• Events (add, edit)\n• Gallery images\n• Stats & initiatives\n• Cookie banner\n\n<b>📸 Photos:</b>\nSend any photo with a short caption.\n\n<b>🎙️ Voice:</b>\nRecord a voice message — I'll transcribe and process it.\n\n<b>💡 Examples:</b>\n• Change hero heading to We Build Community\n• Add team member Sarah as Project Lead\n• Remove the event Spring Gala`
            );
            return NextResponse.json({ ok: true });
        }

        // ─── /undo or /revert ───
        if (text === "/undo" || text === "/revert") {
            await sendTelegram(chatId, "⏳ Reverting last change...");
            const result = await executeCMSAction({ action: "undo" });
            if (result.success) {
                const msg = (result.result as Record<string, string>)?.message || "Last change reverted.";
                await sendTelegram(chatId, `✅ <b>Reverted:</b> ${msg}\n\n🌐 <a href="https://www.holditdowncic.uk">View Live Site</a>`);
                // Auto-deploy
                await sendTelegram(chatId, "🚀 Deploying... (~1-2 min)");
                const deployed = await triggerRevalidation();
                if (deployed) {
                    await sendTelegram(chatId, `✅ <b>Deployed!</b>\n\n🌐 <a href="https://www.holditdowncic.uk">View Live Site</a>`);
                }
            } else {
                await sendTelegram(chatId, `❌ ${result.error || "Nothing to undo."}`);
            }
            return NextResponse.json({ ok: true });
        }

        // ─── /status ───
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

        // ─── /sections ───
        if (text === "/sections") {
            if (!supabaseAdmin) {
                await sendTelegram(chatId, "❌ Database not configured.");
                return NextResponse.json({ ok: true });
            }
            const { data: sections, error: secErr } = await supabaseAdmin
                .from("site_content")
                .select("section, content")
                .order("section");
            if (secErr || !sections) {
                await sendTelegram(chatId, "❌ Could not fetch sections.");
                return NextResponse.json({ ok: true });
            }
            const lines = sections.map((s: { section: string; content: Record<string, unknown> }) => {
                const fields = Object.keys(s.content || {}).join(", ");
                return `📌 <b>${s.section}</b>\n     <i>${fields}</i>`;
            }).join("\n\n");
            await sendTelegram(
                chatId,
                `📁 <b>Website Sections</b>\n\n${lines}\n\n💡 Say: <i>"Change [section] [field] to [value]"</i>`
            );
            return NextResponse.json({ ok: true });
        }

        // ─── /deploy ───
        if (text === "/deploy") {
            await sendTelegram(chatId, "🚀 Deploying...");
            const ok = await triggerRevalidation();
            if (ok) {
                await sendTelegram(chatId, "✅ <b>Deployed!</b>\n\nAll pages revalidated. Changes are now live.");
            } else {
                await sendTelegram(chatId, "❌ Deploy failed. Please try again.");
            }
            return NextResponse.json({ ok: true });
        }

        // ─── /cookies ───
        if (text === "/cookies") {
            if (!supabaseAdmin) {
                await sendTelegram(chatId, "❌ Database not configured.");
                return NextResponse.json({ ok: true });
            }
            const today = new Date().toISOString().split("T")[0];
            const { count: totalAccepted } = await supabaseAdmin.from("cookie_consent_log").select("*", { count: "exact", head: true }).eq("action", "accepted");
            const { count: totalDeclined } = await supabaseAdmin.from("cookie_consent_log").select("*", { count: "exact", head: true }).eq("action", "declined");
            const { count: todayAccepted } = await supabaseAdmin.from("cookie_consent_log").select("*", { count: "exact", head: true }).eq("action", "accepted").gte("created_at", `${today}T00:00:00Z`);
            const { count: todayDeclined } = await supabaseAdmin.from("cookie_consent_log").select("*", { count: "exact", head: true }).eq("action", "declined").gte("created_at", `${today}T00:00:00Z`);
            const total = (totalAccepted || 0) + (totalDeclined || 0);
            const todayTotal = (todayAccepted || 0) + (todayDeclined || 0);
            const acceptRate = total > 0 ? Math.round(((totalAccepted || 0) / total) * 100) : 0;
            await sendTelegram(
                chatId,
                `🍪 <b>Cookie Consent</b>\n\n<b>Today:</b>\n  ✅ ${todayAccepted || 0}  ❌ ${todayDeclined || 0}  📊 ${todayTotal}\n\n<b>All Time:</b>\n  ✅ ${totalAccepted || 0}  ❌ ${totalDeclined || 0}  📊 ${total}\n  🎯 Accept Rate: ${acceptRate}%`
            );
            return NextResponse.json({ ok: true });
        }

        // ─── Photo uploads ───
        let imageUrl: string | undefined;
        if (message.photo && message.photo.length > 0) {
            const largestPhoto = message.photo[message.photo.length - 1];
            await sendTelegram(chatId, "📤 Uploading image...");
            const url = await handlePhoto(largestPhoto.file_id);
            if (url) {
                imageUrl = url;
            } else if (!text) {
                // Only fail hard if there's no text — meaning they ONLY sent an image
                await sendTelegram(chatId, "❌ Failed to upload image. Please try again.");
                return NextResponse.json({ ok: true });
            }
            // If there IS text (e.g. screenshot + caption), continue with just the text
        }

        // ─── Voice messages ───
        if (message.voice || message.audio) {
            const voice = message.voice || message.audio;
            await sendTelegram(chatId, "🎙️ Transcribing your voice message...");
            try {
                const fileResp = await fetch(`${TELEGRAM_API}/getFile?file_id=${voice.file_id}`);
                const fileData = await fileResp.json();
                const filePath = fileData.result?.file_path;
                if (!filePath) {
                    await sendTelegram(chatId, "❌ Could not download voice message.");
                    return NextResponse.json({ ok: true });
                }
                const downloadUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
                const audioResponse = await fetch(downloadUrl);
                const audioBuffer = await audioResponse.arrayBuffer();
                const mimeType = voice.mime_type || "audio/ogg";
                const transcription = await transcribeVoice(audioBuffer, mimeType);
                if (!transcription) {
                    await sendTelegram(chatId, "❌ Could not transcribe voice message. Please type your command instead.");
                    return NextResponse.json({ ok: true });
                }
                // Show what we heard and use it as the command
                await sendTelegram(chatId, `🎙️ <i>"${transcription}"</i>`);
                text = transcription;
            } catch (err) {
                console.error("Voice handling error:", err);
                await sendTelegram(chatId, "❌ Failed to process voice message.");
                return NextResponse.json({ ok: true });
            }
        }

        // ─── Parse natural language command ───
        if (!text && !imageUrl) {
            await sendTelegram(chatId, "💬 Please send a text command or a photo with a caption.");
            return NextResponse.json({ ok: true });
        }

        await sendTelegram(chatId, "🔄 Processing your command...");

        const parsedAction = await parseCommand(text, imageUrl);

        if (parsedAction.action === "unknown") {
            await sendTelegram(
                chatId,
                `🤔 I couldn't understand that.\n\n${parsedAction.message || "Try rephrasing or type /help for examples."}`
            );
            return NextResponse.json({ ok: true });
        }

        // ─── Show preview & ask for confirmation ───
        const actionObj = parsedAction as unknown as Record<string, unknown>;
        const description = describeAction(actionObj);
        const summary = formatSummary(actionObj);

        // Store pending action in DB
        const pendingId = await storePendingAction(chatId, actionObj, description);

        if (pendingId) {
            // Show preview with confirm/cancel buttons
            await sendTelegramWithButtons(
                chatId,
                `📋 <b>Preview</b>\n\n<b>Action:</b> ${description}\n${summary}\n\n<b>Ready to commit?</b>`,
                [
                    [
                        { text: "✅ Yes, Commit", callback_data: `cms_yes_${pendingId}` },
                        { text: "❌ No, Cancel", callback_data: `cms_no_${pendingId}` },
                    ],
                ]
            );
        } else {
            // Fallback: if we can't store pending action, execute directly
            await sendTelegram(chatId, `⏳ ${description}...`);
            const result = await executeCMSAction(actionObj);
            if (result.success) {
                await sendTelegramWithButtons(
                    chatId,
                    `✅ <b>Done!</b>\n\n${description}`,
                    [[
                        { text: "🚀 Deploy Now", callback_data: "cms_deploy" },
                        { text: "↩️ Undo", callback_data: "cms_revert" },
                    ]]
                );
            } else {
                await sendTelegram(chatId, `❌ ${result.error}\n\nPlease try again.`);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Telegram webhook error:", error);
        return NextResponse.json({ ok: true });
    }
}
