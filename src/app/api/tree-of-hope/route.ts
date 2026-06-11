import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveFormSubmission } from "@/lib/form-submissions";
import { cleanTreeContribution, TREE_OF_HOPE_FORM_TYPE, treeZoneLabel } from "@/lib/tree-of-hope";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function truncate(input: string, max = 180): string {
  const trimmed = input.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

async function notifyTreeModerators(submissionId: string, contribution: NonNullable<ReturnType<typeof cleanTreeContribution>>) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!botToken || adminIds.length === 0) {
    console.error("Tree of Hope moderation notice skipped: Telegram bot token or admin ids missing");
    return;
  }

  const text = [
    "🌳 <b>Tree of Hope approval needed</b>",
    `Part: <b>${escapeHtml(treeZoneLabel(contribution.zoneId))}</b>`,
    `From: ${escapeHtml(contribution.author || "Community voice")}`,
    contribution.message ? `Message: ${escapeHtml(truncate(contribution.message))}` : "Message: <i>voice note only</i>",
    contribution.audioDataUrl ? "Voice note: <b>attached on the website submission</b>" : "",
    "",
    "Approve it to place it on the public tree.",
  ].filter(Boolean).join("\n");

  await Promise.all(adminIds.map(async (chatId) => {
    try {
      const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [[
              { text: "✅ Approve tree post", callback_data: `treeok:${submissionId}` },
              { text: "❌ Reject", callback_data: `treeno:${submissionId}` },
            ]],
          },
        }),
      });
      if (!res.ok) {
        console.error("Tree of Hope moderation notice failed:", res.status, await res.text());
      }
    } catch (error) {
      console.error("Tree of Hope moderation notice exception:", error);
    }
  }));
}

export async function GET() {
  if (!supabaseServiceKey) {
    return NextResponse.json({ contributions: [] });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("form_submissions")
    .select("id,payload,created_at")
    .eq("form_type", TREE_OF_HOPE_FORM_TYPE)
    .order("created_at", { ascending: false })
    .limit(75);

  if (error) {
    console.error("Tree of Hope load failed:", error.message);
    return NextResponse.json({ contributions: [] });
  }

  const contributions = (data || [])
    .map((entry) => {
      const cleaned = cleanTreeContribution(entry.payload, {
        fallbackId: entry.id,
        fallbackCreatedAt: entry.created_at,
        requireApproved: true,
      });
      if (!cleaned) return null;
      return {
        ...cleaned,
        id: cleaned.id || entry.id,
        createdAt: cleaned.createdAt || entry.created_at,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ contributions });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contribution = cleanTreeContribution({
      ...body,
      moderationStatus: "pending",
    });

    if (!contribution) {
      return NextResponse.json(
        { error: "Add a message or voice note before saving." },
        { status: 400 },
      );
    }

    const savedSubmission = await saveFormSubmission({
      formType: TREE_OF_HOPE_FORM_TYPE,
      sourcePath: "/#tree-of-hope",
      payload: contribution,
      request,
      contactName: contribution.author,
      subject: `Tree of Hope - ${contribution.zoneId}`,
    });

    if (!savedSubmission.saved) {
      return NextResponse.json(
        { error: "Tree of Hope archive is temporarily unavailable." },
        { status: 503 },
      );
    }

    if (savedSubmission.backend === "table" && savedSubmission.id) {
      await notifyTreeModerators(savedSubmission.id, contribution);
    }

    return NextResponse.json({ success: true, pendingApproval: true });
  } catch (error) {
    console.error("Tree of Hope save failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
