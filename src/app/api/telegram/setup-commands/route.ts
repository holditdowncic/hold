import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// Register bot menu commands with Telegram + ensure DB tables exist
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    const secret = process.env.CMS_API_SECRET;
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: Record<string, unknown> = {};

    // 1. Set bot commands (the menu)
    const commands = [
        { command: "start", description: "👋 Welcome message" },
        { command: "help", description: "🏗 Show available sections" },
        { command: "status", description: "📊 CMS status overview" },
        { command: "sections", description: "📁 List all website sections" },
        { command: "undo", description: "↩️ Undo last change" },
        { command: "revert", description: "🔙 Revert last change" },
        { command: "deploy", description: "🚀 Push changes live" },
        { command: "cookies", description: "🍪 Cookie consent analytics" },
    ];

    try {
        const res = await fetch(`${TELEGRAM_API}/setMyCommands`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commands }),
        });
        const data = await res.json();
        results.commands = data.ok ? "✅ Menu commands set" : `❌ ${data.description}`;
    } catch (e) {
        results.commands = `❌ ${e instanceof Error ? e.message : "Failed"}`;
    }

    // 2. Create pending_cms_actions table if it doesn't exist
    if (supabaseAdmin) {
        try {
            const { error } = await supabaseAdmin.rpc("exec_sql", {
                query: `
                    CREATE TABLE IF NOT EXISTS pending_cms_actions (
                        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                        chat_id bigint NOT NULL,
                        action_data jsonb NOT NULL,
                        description text DEFAULT '',
                        created_at timestamptz DEFAULT now()
                    );
                    -- Auto-clean old pending actions (older than 1 hour)
                    DELETE FROM pending_cms_actions WHERE created_at < now() - interval '1 hour';
                `,
            });
            if (error) {
                // Table might already exist or rpc might not exist — try a test insert/delete
                const { error: testErr } = await supabaseAdmin
                    .from("pending_cms_actions")
                    .select("id")
                    .limit(1);
                results.pending_table = testErr
                    ? `⚠️ Table missing. Run this SQL in Supabase Dashboard:\n\nCREATE TABLE pending_cms_actions (\n  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n  chat_id bigint NOT NULL,\n  action_data jsonb NOT NULL,\n  description text DEFAULT '',\n  created_at timestamptz DEFAULT now()\n);`
                    : "✅ pending_cms_actions table exists";
            } else {
                results.pending_table = "✅ pending_cms_actions table created/verified";
            }
        } catch {
            results.pending_table = "⚠️ Could not verify table";
        }
    }

    return NextResponse.json({ success: true, results });
}
