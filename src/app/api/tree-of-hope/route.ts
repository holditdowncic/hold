import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveFormSubmission } from "@/lib/form-submissions";
import { cleanTreeContribution, TREE_OF_HOPE_FORM_TYPE, treeZoneLabel } from "@/lib/tree-of-hope";
import { uploadTreeVoiceNote } from "@/lib/tree-of-hope-server";

export const runtime = "nodejs";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const rateLimitWindowMs = 60_000;
const rateLimitMaxSubmissions = 5;

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

function getRequestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function dataUrlToBlob(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  const [, mimeType, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  return new Blob([bytes], { type: mimeType });
}

function audioFilename(mimeType?: string) {
  if (mimeType?.includes("ogg")) return "tree-of-hope.ogg";
  if (mimeType?.includes("mpeg")) return "tree-of-hope.mp3";
  if (mimeType?.includes("mp4")) return "tree-of-hope.m4a";
  return "tree-of-hope.webm";
}

function siteUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

async function sendTelegramAudio(
  chatId: string,
  audioDataUrl: string,
  caption: string,
  submissionId: string,
) {
  const blob = dataUrlToBlob(audioDataUrl);
  if (!blob) return false;

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("audio", blob, audioFilename(blob.type));
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  form.append("reply_markup", JSON.stringify({
    inline_keyboard: [[
      { text: "✅ Approve tree post", callback_data: `treeok:${submissionId}` },
      { text: "❌ Reject", callback_data: `treeno:${submissionId}` },
    ]],
  }));

  const res = await fetch(`${TELEGRAM_API}/sendAudio`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    console.error("Tree of Hope moderation audio failed:", res.status, await res.text());
    return false;
  }
  return true;
}

async function isRateLimited(request: NextRequest) {
  if (!supabaseServiceKey) return false;

  const since = new Date(Date.now() - rateLimitWindowMs).toISOString();
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { count, error } = await supabase
    .from("form_submissions")
    .select("id", { count: "exact", head: true })
    .eq("form_type", TREE_OF_HOPE_FORM_TYPE)
    .eq("ip_address", getRequestIp(request))
    .gte("created_at", since);

  if (error) {
    console.error("Tree of Hope rate limit check failed:", error.message);
    return false;
  }

  return (count || 0) >= rateLimitMaxSubmissions;
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
    contribution.audioDataUrl ? "Voice note: <b>preview attached</b>" : "",
    contribution.audioUrl ? `Voice note: ${escapeHtml(contribution.audioUrl)}` : "",
    "",
    "Approve it to place it on the public tree.",
  ].filter(Boolean).join("\n");

  await Promise.all(adminIds.map(async (chatId) => {
    try {
      if (contribution.audioDataUrl) {
        const sentAudio = await sendTelegramAudio(chatId, contribution.audioDataUrl, text, submissionId);
        if (sentAudio) return;
      }

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

async function sendTreeEmailNotification(
  request: NextRequest,
  submissionId: string,
  contribution: NonNullable<ReturnType<typeof cleanTreeContribution>>,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Tree email skipped: RESEND_API_KEY missing");
    return;
  }

  const from = process.env.TREE_EMAIL_FROM || "Hold It Down <onboarding@resend.dev>";
  const to = process.env.TREE_EMAIL_TO || "info@holditdown.uk";
  const baseUrl = siteUrl(request);
  const emailToken = process.env.TREE_ADMIN_EMAIL_TOKEN || process.env.TREE_ADMIN_TOKEN || process.env.TREE_ADMIN_PASSWORD;
  const approveUrl = emailToken
    ? `${baseUrl}/api/tree-admin?id=${encodeURIComponent(submissionId)}&status=approved&token=${encodeURIComponent(emailToken)}`
    : `${baseUrl}/tree-admin?id=${encodeURIComponent(submissionId)}`;
  const rejectUrl = emailToken
    ? `${baseUrl}/api/tree-admin?id=${encodeURIComponent(submissionId)}&status=rejected&token=${encodeURIComponent(emailToken)}`
    : `${baseUrl}/tree-admin?id=${encodeURIComponent(submissionId)}`;

  const message = contribution.message || "Voice note only";
  const html = [
    "<h2>New Tree of Hope leaf</h2>",
    `<p><strong>From:</strong> ${escapeHtml(contribution.author || "Community voice")}</p>`,
    `<p><strong>Part:</strong> ${escapeHtml(treeZoneLabel(contribution.zoneId))}</p>`,
    `<p><strong>Message preview:</strong><br>${escapeHtml(truncate(message, 280))}</p>`,
    contribution.audioUrl ? `<p><strong>Voice note:</strong> <a href="${escapeHtml(contribution.audioUrl)}">Play voice note</a></p>` : "",
    `<p><a href="${escapeHtml(approveUrl)}">Approve this leaf</a></p>`,
    `<p><a href="${escapeHtml(rejectUrl)}">Reject this leaf</a></p>`,
    `<p><a href="${escapeHtml(`${baseUrl}/tree-admin`)}">Open Tree admin</a></p>`,
  ].filter(Boolean).join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `New Tree of Hope leaf from ${contribution.author || "Community voice"}`,
      html,
      text: [
        "New Tree of Hope leaf",
        `From: ${contribution.author || "Community voice"}`,
        `Part: ${treeZoneLabel(contribution.zoneId)}`,
        `Message preview: ${truncate(message, 280)}`,
        contribution.audioUrl ? `Voice note: ${contribution.audioUrl}` : "",
        `Approve: ${approveUrl}`,
        `Reject: ${rejectUrl}`,
        `Admin: ${baseUrl}/tree-admin`,
      ].filter(Boolean).join("\n"),
    }),
  });

  if (!res.ok) {
    console.error("Tree email failed:", res.status, await res.text());
  }
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

    if (contribution.consentAccepted !== true) {
      return NextResponse.json(
        { error: "Please confirm consent before sending this to the Tree of Hope." },
        { status: 400 },
      );
    }

    if (await isRateLimited(request)) {
      return NextResponse.json(
        { error: "Too many Tree of Hope submissions. Please wait a minute and try again." },
        { status: 429 },
      );
    }

    let payloadToSave = contribution;
    if (contribution.audioDataUrl) {
      const duration = contribution.audioDurationSeconds ?? 0;
      if (duration > 60) {
        return NextResponse.json(
          { error: "Voice notes must be 60 seconds or less." },
          { status: 400 },
        );
      }

      const uploaded = await uploadTreeVoiceNote(contribution.audioDataUrl, contribution.id || crypto.randomUUID());
      payloadToSave = {
        ...contribution,
        ...uploaded,
        audioDataUrl: undefined,
      };
    }

    const savedSubmission = await saveFormSubmission({
      formType: TREE_OF_HOPE_FORM_TYPE,
      sourcePath: "/tree-of-hope",
      payload: payloadToSave,
      request,
      contactName: payloadToSave.author,
      subject: `Tree of Hope - ${payloadToSave.zoneId}`,
    });

    if (!savedSubmission.saved) {
      return NextResponse.json(
        { error: "Tree of Hope archive is temporarily unavailable." },
        { status: 503 },
      );
    }

    if (savedSubmission.backend === "table" && savedSubmission.id) {
      await Promise.all([
        notifyTreeModerators(savedSubmission.id, payloadToSave),
        sendTreeEmailNotification(request, savedSubmission.id, payloadToSave),
      ]);
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
