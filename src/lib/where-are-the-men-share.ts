import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveFormSubmission, type FormSubmissionInput, type FormSubmissionSaveResult } from "./form-submissions";

export type WhereAreTheMenShareDependencies = {
  saveSubmission?: (input: FormSubmissionInput) => Promise<FormSubmissionSaveResult>;
  isRateLimited?: (request: NextRequest) => Promise<boolean>;
  fetchImpl?: typeof fetch;
  telegramBotToken?: string;
  telegramAdminIds?: string[];
};

const formType = "where_are_the_men_share";
const sourcePath = "/where-are-the-men/share";
const subject = "Where Are The Men - Share Your Voice";
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rateLimitWindowMs = 60_000;
const rateLimitMaxSubmissions = 5;
const localRateLimit = new Map<string, number[]>();

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveAdminIds(explicit?: string[]) {
  if (explicit) return explicit;
  return (process.env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

async function notifyTelegram(
  payload: { name: string; message: string },
  deps: WhereAreTheMenShareDependencies,
) {
  const botToken = deps.telegramBotToken ?? process.env.TELEGRAM_BOT_TOKEN;
  const adminIds = resolveAdminIds(deps.telegramAdminIds);
  if (!botToken || adminIds.length === 0) {
    console.error("Where Are The Men share Telegram notification skipped: bot token or admin ids missing");
    return;
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const text = [
    "🗣️ <b>Where Are The Men voice shared</b>",
    "",
    `<b>Name:</b> ${escapeHtml(payload.name)}`,
    "",
    "<b>Message:</b>",
    escapeHtml(payload.message),
    "",
    "—",
    "<i>Sent from /where-are-the-men/share</i>",
  ].join("\n");

  await Promise.all(adminIds.map(async (chatId) => {
    try {
      const response = await fetchImpl(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      if (!response.ok) {
        console.error("Where Are The Men share Telegram notification failed:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Where Are The Men share Telegram notification error:", error);
    }
  }));
}

async function defaultIsRateLimited(request: NextRequest) {
  const ipAddress = getRequestIp(request);
  const sinceMs = Date.now() - rateLimitWindowMs;

  if (supabaseServiceKey) {
    const since = new Date(sinceMs).toISOString();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { count, error } = await supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("form_type", formType)
      .eq("ip_address", ipAddress)
      .gte("created_at", since);

    if (!error) return (count || 0) >= rateLimitMaxSubmissions;
    console.error("Where Are The Men share rate limit check failed:", error.message);
  }

  const recent = (localRateLimit.get(ipAddress) || []).filter((timestamp) => timestamp >= sinceMs);
  if (recent.length >= rateLimitMaxSubmissions) {
    localRateLimit.set(ipAddress, recent);
    return true;
  }
  recent.push(Date.now());
  localRateLimit.set(ipAddress, recent);
  return false;
}

export async function handleWhereAreTheMenShareSubmission(
  request: NextRequest,
  deps: WhereAreTheMenShareDependencies = {},
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please add your name and what you want to share." },
      { status: 400 },
    );
  }

  const bodyRecord = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const name = cleanText(bodyRecord.name);
  const message = cleanText(bodyRecord.message);

  if (!name || !message) {
    return NextResponse.json(
      { error: "Please add your name and what you want to share." },
      { status: 400 },
    );
  }
  if (name.length > 80) {
    return NextResponse.json(
      { error: "Please keep your name to 80 characters or less." },
      { status: 400 },
    );
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Please keep your message to 2000 characters or less." },
      { status: 400 },
    );
  }
  const isRateLimited = deps.isRateLimited ?? defaultIsRateLimited;
  if (await isRateLimited(request)) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const payload = {
    name,
    message,
    campaign: "Where Are The Men",
    event: "Friday 26 June 2026",
  };

  const saveSubmission = deps.saveSubmission ?? saveFormSubmission;
  const savedSubmission = await saveSubmission({
    formType,
    sourcePath,
    payload,
    request,
    contactName: name,
    subject,
  });

  if (!savedSubmission.saved) {
    return NextResponse.json(
      { error: "The form is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  await notifyTelegram({ name, message }, deps);

  return NextResponse.json({ success: true, redirectTo: "/" });
}
