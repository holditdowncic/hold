import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type {
  CMSAction,
  ContactItem,
  CustomSection,
  EventData,
  EventGalleryItem,
  GalleryImage,
  Initiative,
  Program,
  Stat,
  TeamMember,
} from "@/lib/types";
import { parseCommand, parseCommandWithMedia } from "@/lib/openrouter";
import { generateFileContent, planCodeEdit } from "@/lib/openrouter-code";
import {
  getGitHubFile,
  getCommitStatus,
  listRecentCommits,
  closePullRequest,
  getPullRequest,
  createCommitWithFiles,
  mergePullRequest,
  putGitHubBinaryFile,
  putGitHubFile,
  revertCommit,
} from "@/lib/github";
import {
  cleanTreeContribution,
  TREE_OF_HOPE_FORM_TYPE,
  treeZoneLabel,
  type TreeModerationStatus,
} from "@/lib/tree-of-hope";

// This route uses Node-only APIs (Buffer). Force Node runtime on Vercel.
export const runtime = "nodejs";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const TELEGRAM_FILE_API = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type TelegramInlineButton =
  | { text: string; callback_data: string; url?: never }
  | { text: string; url: string; callback_data?: never };

type TelegramPhotoSize = {
  file_id: string;
  file_size?: number;
  width?: number;
  height?: number;
};

type TelegramAudioLike = {
  file_id: string;
  file_size?: number;
  mime_type?: string;
  duration?: number;
};

function isAdmin(userId: number): boolean {
  const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return adminIds.includes(String(userId));
}

function verifyWebhookSecret(req: NextRequest): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.CMS_API_SECRET;
  if (!expected) return true; // allow if not configured
  const got = req.headers.get("x-telegram-bot-api-secret-token");
  return got === expected;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function codeInline(value: string): string {
  return `<code>${escapeHtml(value)}</code>`;
}

function truncate(input: string, max = 140): string {
  const s = input.trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

type CommitMeta = {
  fromId?: number;
  requestText?: string;
};

function buildTelegramCommitMessage(description: string, meta?: CommitMeta): string {
  const bits: string[] = [`telegram: ${description}`];
  if (meta?.fromId) bits.push(`by tg:${meta.fromId}`);
  if (meta?.requestText) bits.push(truncate(meta.requestText, 90));
  return bits.join(" | ");
}

function fmtState(state: string): string {
  switch (state) {
    case "success":
      return "✅ Ready";
    case "pending":
      return "⏳ Deploying";
    case "failure":
      return "❌ Failed";
    case "error":
      return "⚠️ Error";
    default:
      return escapeHtml(state);
  }
}

function pickVercelStatus(
  statuses: Array<{ context: string; state: string; target_url?: string | null; description?: string | null }>
) {
  const preferred = statuses.find((s) => /vercel/i.test(s.context));
  return preferred || statuses[0] || null;
}

function parseMaybeJson(valueText: string): unknown {
  const v = valueText.trim();
  if (!v) return "";
  const looksJson =
    v.startsWith("{") ||
    v.startsWith("[") ||
    v.startsWith("\"") ||
    v === "true" ||
    v === "false" ||
    v === "null" ||
    /^-?\d+(\.\d+)?$/.test(v);
  if (!looksJson) return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function parseDeterministicCommand(text: string): CMSAction[] | null {
  const t = text.trim();
  if (!t.startsWith("/")) return null;

  // /set hero.badge "New badge"
  if (t.startsWith("/set ")) {
    const rest = t.slice("/set ".length).trim();
    const firstSpace = rest.indexOf(" ");
    if (firstSpace === -1) {
      return [{ action: "unknown", message: "Usage: /set <section>.<field> <value>" }];
    }
    const path = rest.slice(0, firstSpace).trim();
    const valueText = rest.slice(firstSpace + 1);
    const dot = path.indexOf(".");
    if (dot === -1) {
      return [{ action: "unknown", message: "Usage: /set <section>.<field> <value>" }];
    }
    const section = path.slice(0, dot);
    const field = path.slice(dot + 1);
    return [{ action: "update_section_field", section, field, value: parseMaybeJson(valueText) }];
  }

  // /replace hero {"heading_line1":"I Can", ...}
  if (t.startsWith("/replace ")) {
    const rest = t.slice("/replace ".length).trim();
    const firstSpace = rest.indexOf(" ");
    if (firstSpace === -1) {
      return [{ action: "unknown", message: "Usage: /replace <section> <json-object>" }];
    }
    const section = rest.slice(0, firstSpace).trim();
    const jsonText = rest.slice(firstSpace + 1).trim();
    const content = parseMaybeJson(jsonText);
    if (!content || typeof content !== "object" || Array.isArray(content)) {
      return [{ action: "unknown", message: "Usage: /replace <section> <json-object>" }];
    }
    return [{ action: "update_section", section, content: content as Record<string, unknown> }];
  }

  // /apply {"actions":[ ... ]}
  if (t.startsWith("/apply ")) {
    const jsonText = t.slice("/apply ".length).trim();
    const parsed = parseMaybeJson(jsonText);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as { actions?: CMSAction[]; action?: string };
      if (Array.isArray(obj.actions)) return obj.actions;
      if (typeof (obj as CMSAction).action === "string") return [obj as unknown as CMSAction];
    }
    return [{ action: "unknown", message: "Usage: /apply <json> where json is CMSAction or {\"actions\":[...]}" }];
  }

  return null;
}

function parseHeuristicActions(text: string): CMSAction[] | null {
  const t = (text || "").toLowerCase();
  if (!t) return null;

  function extractColors(raw: string): string[] {
    const s = raw.toLowerCase();
    const out: Array<{ idx: number; v: string }> = [];

    // hex
    for (const m of s.matchAll(/#[0-9a-f]{3,8}\b/g)) {
      out.push({ idx: m.index ?? 0, v: m[0] });
    }
    // rgb/rgba/hsl/hsla
    for (const m of s.matchAll(/\b(?:rgb|rgba|hsl|hsla)\([^)]+\)/g)) {
      out.push({ idx: m.index ?? 0, v: m[0] });
    }
    // basic named colors (CSS keywords are fine as values)
    const names = [
      "green",
      "red",
      "blue",
      "orange",
      "yellow",
      "purple",
      "pink",
      "black",
      "white",
      "gray",
      "grey",
      "teal",
      "cyan",
    ];
    for (const name of names) {
      const re = new RegExp(`\\b${name}\\b`, "g");
      for (const m of s.matchAll(re)) {
        out.push({ idx: m.index ?? 0, v: name === "grey" ? "gray" : name });
      }
    }

    return out.sort((a, b) => a.idx - b.idx).map((x) => x.v);
  }

  function wantsDarkMode(s: string) {
    return /\bdark\b|\bdark mode\b|\bnight\b/.test(s);
  }
  function wantsLightMode(s: string) {
    return /\blight\b|\blight mode\b|\bday\b/.test(s);
  }

  // Theme: plain English color changes (accent/background/text/border) + gradient.
  // Examples:
  // - "make accent green"
  // - "set background to #ffffff"
  // - "make the gradient from purple to orange"
  const colors = extractColors(t);
  if (colors.length) {
    const mode: "light" | "dark" | "both" = wantsDarkMode(t) && !wantsLightMode(t) ? "dark" : wantsLightMode(t) && !wantsDarkMode(t) ? "light" : "both";

    const actions: CMSAction[] = [];
    const pushTheme = (field: string, value: unknown) => {
      if (mode === "light" || mode === "both") actions.push({ action: "update_section_field", section: "theme", field: `light.${field}`, value });
      if (mode === "dark" || mode === "both") actions.push({ action: "update_section_field", section: "theme", field: `dark.${field}`, value });
    };

    // gradient request: set accent + accent_warm if 2 colors mentioned.
    if (t.includes("gradient") && colors.length >= 2) {
      pushTheme("accent", colors[0]!);
      pushTheme("accent_warm", colors[1]!);
      return actions;
    }

    // single-color mappings
    const c = colors[0]!;
    if (t.includes("accent")) {
      pushTheme("accent", c);
      return actions;
    }
    if (t.includes("background") || /\bbg\b/.test(t)) {
      // Try to detect card/background variants
      if (t.includes("card")) pushTheme("bg_card", c);
      else if (t.includes("elevated")) pushTheme("bg_elevated", c);
      else pushTheme("bg", c);
      return actions;
    }
    if (t.includes("border")) {
      pushTheme("border", c);
      return actions;
    }
    if (t.includes("text")) {
      if (t.includes("secondary")) pushTheme("text_secondary", c);
      else if (t.includes("tertiary")) pushTheme("text_tertiary", c);
      else pushTheme("text_primary", c);
      return actions;
    }
  }

  // Contact email: "change the email to x@y.com"
  const emailMatch = (text || "").match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  if (emailMatch && /\b(email|e-mail)\b/i.test(text) && /\b(change|set|update)\b/i.test(text)) {
    return [{ action: "update_section_field", section: "contact", field: "email", value: emailMatch[0] }];
  }

  // Contact instagram: "change instagram to @handle" / "set instagram to https://instagram.com/handle"
  if (/\binstagram\b/i.test(text) && /\b(change|set|update)\b/i.test(text)) {
    const handle = (text || "").match(/@[a-zA-Z0-9._]+/);
    const url = (text || "").match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s)]+/i);
    const v = (url?.[0] || handle?.[0] || "").trim();
    if (v) return [{ action: "update_section_field", section: "contact", field: "instagram", value: v }];
  }

  // Contact phone: "change phone to +44 ..." / "set telephone to 07..."
  if (/\b(phone|telephone|mobile)\b/i.test(text) && /\b(change|set|update)\b/i.test(text)) {
    const m = (text || "").match(/(\+?\d[\d\s().-]{6,}\d)/);
    if (m?.[1]) return [{ action: "update_section_field", section: "contact", field: "phone", value: m[1].trim() }];
  }

  // Contact location: "change location/address to ..."
  if (/\b(location|address)\b/i.test(text) && /\b(change|set|update)\b/i.test(text)) {
    const m =
      (text || "").match(/\b(?:change|set|update)\b.{0,20}\b(?:location|address)\b.{0,20}\b(?:to|as)\b\s+(.+)$/i) ||
      (text || "").match(/\b(?:location|address)\b\s+(?:to|as)\s+(.+)$/i);
    if (m?.[1]) return [{ action: "update_section_field", section: "contact", field: "location", value: m[1].trim() }];
  }

  // Hero gradient toggles: users often say "keep gradient on I Can" / "remove gradient from You Can".
  // This should "just work" without relying on the AI outputting the exact JSON schema.
  if (t.includes("gradient") && (t.includes("i can") || t.includes("you can"))) {
    const actions: CMSAction[] = [];

    const wantsICanGradient =
      /(keep|add|make|apply|put).{0,20}gradient.{0,20}(to|on|for).{0,20}i can/.test(t) ||
      /(i can).{0,20}(keep|add|make|apply|put).{0,20}gradient/.test(t);
    const wantsICanPlain =
      /(remove|no).{0,20}gradient.{0,20}(from|off).{0,20}i can/.test(t) ||
      /(i can).{0,20}(remove|no).{0,20}gradient/.test(t);

    const wantsYouCanGradient =
      /(keep|add|make|apply|put).{0,20}gradient.{0,20}(to|on|for).{0,20}you can/.test(t) ||
      /(you can).{0,20}(keep|add|make|apply|put).{0,20}gradient/.test(t);
    const wantsYouCanPlain =
      /(remove|no).{0,20}gradient.{0,20}(from|off).{0,20}you can/.test(t) ||
      /(you can).{0,20}(remove|no).{0,20}gradient/.test(t);

    if (wantsICanGradient || wantsICanPlain) {
      actions.push({
        action: "update_section_field",
        section: "hero",
        field: "heading_line1_gradient",
        value: Boolean(wantsICanGradient) && !wantsICanPlain,
      });
    }
    if (wantsYouCanGradient || wantsYouCanPlain) {
      actions.push({
        action: "update_section_field",
        section: "hero",
        field: "heading_line2_gradient",
        value: Boolean(wantsYouCanGradient) && !wantsYouCanPlain,
      });
    }

    if (actions.length) return actions;
  }

  // Hero copy tweaks: "change i can to X", "change you can to X", "change we can to X".
  // Also supports "set hero line1 to X".
  const m1 =
    t.match(/(?:change|set)\s+i can\s+(?:to|as)\s+["“]?(.+?)["”]?\s*$/i) ||
    t.match(/(?:hero\s*)?line\s*1\s+(?:to|as)\s+["“]?(.+?)["”]?\s*$/i);
  if (m1?.[1]) {
    return [{ action: "update_section_field", section: "hero", field: "heading_line1", value: m1[1].trim() }];
  }
  const m2 =
    t.match(/(?:change|set)\s+you can\s+(?:to|as)\s+["“]?(.+?)["”]?\s*$/i) ||
    t.match(/(?:hero\s*)?line\s*2\s+(?:to|as)\s+["“]?(.+?)["”]?\s*$/i);
  if (m2?.[1]) {
    return [{ action: "update_section_field", section: "hero", field: "heading_line2", value: m2[1].trim() }];
  }
  const m3 =
    t.match(/(?:change|set)\s+we can\s+(?:to|as)\s+["“]?(.+?)["”]?\s*$/i) ||
    t.match(/(?:hero\s*)?line\s*3\s+(?:to|as)\s+["“]?(.+?)["”]?\s*$/i);
  if (m3?.[1]) {
    return [{ action: "update_section_field", section: "hero", field: "heading_line3", value: m3[1].trim() }];
  }

  return null;
}

function normalizeSlashCommandText(text: string): string {
  const t = text.trim();
  if (!t.startsWith("/")) return t;
  const parts = t.split(/\s+/);
  // Support group chats where Telegram sends /cmd@BotName
  parts[0] = parts[0].split("@")[0] || parts[0];
  return parts.join(" ");
}

function isAllowedCodePath(path: string): boolean {
  const p = path.trim();
  if (!p) return false;
  if (p.startsWith("/") || p.includes("..")) return false;
  const deny = [
    ".env",
    ".git",
    "node_modules",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
  ];
  if (deny.some((x) => p === x || p.startsWith(`${x}/`))) return false;

  if (p.startsWith("src/")) return true;
  if (p.startsWith("public/")) return true;

  return [
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "next.config.mjs",
    "postcss.config.js",
    "tailwind.config.js",
    "tailwind.config.ts",
    "README.md",
  ].includes(p);
}

async function sendTelegram(
  chatId: number,
  text: string,
  buttons?: TelegramInlineButton[][],
  opts?: { disablePreview?: boolean }
) {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("Telegram sendMessage skipped: TELEGRAM_BOT_TOKEN missing");
      return;
    }
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: opts?.disablePreview ?? true,
        ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram sendMessage failed:", res.status, body);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Telegram sendMessage exception:", msg);
  }
}

async function sendChatAction(chatId: number, action: "typing" | "upload_photo" | "upload_document" = "typing") {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;
    await fetch(`${TELEGRAM_API}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch {
    // Non-critical
  }
}

async function answerCallback(callbackId: string, text?: string) {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackId, text: text || "" }),
    });
  } catch {
    // Non-critical
  }
}

type FormSubmissionRow = {
  id: string;
  payload: unknown;
  created_at?: string;
};

function getTreeModerationClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

function treeContributionSummary(row: FormSubmissionRow) {
  const contribution = cleanTreeContribution(row.payload, {
    fallbackId: row.id,
    fallbackCreatedAt: row.created_at,
  });
  if (!contribution) return null;

  return [
    `ID: ${codeInline(row.id)}`,
    `Part: <b>${escapeHtml(treeZoneLabel(contribution.zoneId))}</b>`,
    `From: ${escapeHtml(contribution.author || "Community voice")}`,
    contribution.message ? `Message: ${escapeHtml(truncate(contribution.message, 220))}` : "Message: <i>voice note only</i>",
    contribution.audioDataUrl ? "Voice note: <b>yes</b>" : "",
    `Status: <b>${escapeHtml(contribution.moderationStatus || "pending")}</b>`,
  ].filter(Boolean).join("\n");
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

async function sendTelegramTreeAudio(
  chatId: number,
  row: FormSubmissionRow,
  caption: string,
  buttons: TelegramInlineButton[][],
) {
  const contribution = cleanTreeContribution(row.payload, {
    fallbackId: row.id,
    fallbackCreatedAt: row.created_at,
  });
  if (!contribution?.audioDataUrl || !process.env.TELEGRAM_BOT_TOKEN) return false;

  const blob = dataUrlToBlob(contribution.audioDataUrl);
  if (!blob) return false;

  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("audio", blob, audioFilename(blob.type));
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  form.append("reply_markup", JSON.stringify({ inline_keyboard: buttons }));

  const res = await fetch(`${TELEGRAM_API}/sendAudio`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    console.error("Telegram tree audio failed:", res.status, await res.text());
    return false;
  }
  return true;
}

async function updateTreeContributionStatus(
  submissionId: string,
  status: TreeModerationStatus,
  moderatorId: number,
) {
  const supabase = getTreeModerationClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select("id,payload,created_at")
    .eq("id", submissionId)
    .eq("form_type", TREE_OF_HOPE_FORM_TYPE)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Tree submission not found");
  }

  const row = data as FormSubmissionRow;
  const contribution = cleanTreeContribution(row.payload, {
    fallbackId: row.id,
    fallbackCreatedAt: row.created_at,
  });
  if (!contribution) {
    throw new Error("Tree submission payload is invalid");
  }

  const nextPayload = {
    ...contribution,
    moderationStatus: status,
    moderatedAt: new Date().toISOString(),
    moderatedBy: String(moderatorId),
  };

  const { error: updateError } = await supabase
    .from("form_submissions")
    .update({
      payload: nextPayload,
      subject: `Tree of Hope - ${treeZoneLabel(contribution.zoneId)} - ${status}`,
    })
    .eq("id", submissionId)
    .eq("form_type", TREE_OF_HOPE_FORM_TYPE);

  if (updateError) throw new Error(updateError.message);
  return nextPayload;
}

function treeButtons(row: FormSubmissionRow, status: TreeModerationStatus): TelegramInlineButton[][] {
  if (status === "approved") {
    return [[{ text: "🙈 Hide from tree", callback_data: `treeno:${row.id}` }]];
  }
  if (status === "rejected") {
    return [[{ text: "✅ Approve tree post", callback_data: `treeok:${row.id}` }]];
  }
  return [[
    { text: "✅ Approve tree post", callback_data: `treeok:${row.id}` },
    { text: "❌ Reject", callback_data: `treeno:${row.id}` },
  ]];
}

async function handleTreeList(chatId: number, status: TreeModerationStatus) {
  try {
    const supabase = getTreeModerationClient();
    const { data, error } = await supabase
      .from("form_submissions")
      .select("id,payload,created_at")
      .eq("form_type", TREE_OF_HOPE_FORM_TYPE)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) throw new Error(error.message);

    const matches = ((data || []) as FormSubmissionRow[])
      .map((row) => ({ row, contribution: cleanTreeContribution(row.payload, { fallbackId: row.id, fallbackCreatedAt: row.created_at }) }))
      .filter(({ contribution }) => contribution?.moderationStatus === status)
      .slice(0, 10);

    if (matches.length === 0) {
      const emptyText = status === "pending"
        ? "🌳 No Tree of Hope posts are waiting for approval."
        : `🌳 No ${status} Tree of Hope posts found.`;
      await sendTelegram(chatId, emptyText);
      return;
    }

    for (const { row } of matches) {
      const summary = treeContributionSummary(row);
      if (!summary) continue;
      const title = status === "pending" ? "Tree of Hope pending approval" : `Tree of Hope ${status}`;
      const caption = `🌳 <b>${escapeHtml(title)}</b>\n${summary}`;
      const buttons = treeButtons(row, status);
      const sentAudio = await sendTelegramTreeAudio(chatId, row, caption, buttons);
      if (!sentAudio) {
        await sendTelegram(chatId, caption, buttons);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await sendTelegram(chatId, `Tree moderation failed: ${codeInline(msg)}`);
  }
}

async function handleTreeHelp(chatId: number) {
  await sendTelegram(
    chatId,
    [
      "🌳 <b>Tree of Hope controls</b>",
      `${codeInline("/tree pending")} — approve or reject waiting posts`,
      `${codeInline("/tree live")} — review live posts and hide any post`,
      `${codeInline("/tree rejected")} — restore a rejected post if needed`,
    ].join("\n"),
  );
}

function jsonPretty(value: unknown) {
  return JSON.stringify(value, null, 2) + "\n";
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function nextSortOrder<T extends { sort_order: number }>(items: T[]): number {
  return (items.reduce((max, it) => Math.max(max, it.sort_order || 0), 0) || 0) + 1;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function updateJsonFile<T>(
  path: string,
  mutate: (data: T) => { data: T; description: string } | { error: string },
  meta?: CommitMeta
) {
  let attempt = 0;
  while (attempt < 2) {
    attempt++;
    const current = await getGitHubFile(path);
    const parsed = JSON.parse(current.text) as T;
    const result = mutate(parsed);
    if ("error" in result) {
      return { error: result.error } as const;
    }
    const { data, description } = result;
    try {
      const res = await putGitHubFile({
        path,
        sha: current.sha,
        text: jsonPretty(data),
        message: buildTelegramCommitMessage(description, meta),
      });
      return { description, ...res };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // GitHub Contents API: 409 when the provided sha doesn't match the latest.
      // Retry once by refetching latest sha and reapplying the mutation.
      if (attempt < 2 && msg.includes("(409)")) continue;
      throw e;
    }
  }
  throw new Error("Update failed after retry.");
}

function guessMimeFromPath(filePath: string): string {
  const p = filePath.toLowerCase();
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".gif")) return "image/gif";
  if (p.endsWith(".mp3")) return "audio/mpeg";
  if (p.endsWith(".wav")) return "audio/wav";
  if (p.endsWith(".ogg") || p.endsWith(".oga")) return "audio/ogg";
  if (p.endsWith(".m4a")) return "audio/mp4";
  if (p.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

function extFromPath(filePath: string): string {
  const idx = filePath.lastIndexOf(".");
  if (idx === -1) return "";
  return filePath.slice(idx + 1).toLowerCase().slice(0, 10);
}

function pickLargestPhoto(photos: TelegramPhotoSize[]): TelegramPhotoSize {
  return photos.reduce(
    (best, p) => ((p.file_size ?? 0) > (best.file_size ?? 0) ? p : best),
    photos[0]
  );
}

function pickPhotoForVision(photos: TelegramPhotoSize[], maxBytes = 900_000): TelegramPhotoSize {
  // For vision parsing, prefer a reasonably-sized image to avoid huge base64 payloads.
  // Telegram provides multiple sizes in message.photo; pick the largest under maxBytes, else the smallest.
  const sorted = [...photos].sort((a, b) => (a.file_size ?? 0) - (b.file_size ?? 0));
  const within = sorted.filter((p) => (p.file_size ?? 0) <= maxBytes);
  return (within.length ? within[within.length - 1] : sorted[0]) || photos[0];
}

type JsonContainer = Record<string, unknown> | unknown[];

function setDeepValue(root: JsonContainer, path: string, value: unknown) {
  const parts = String(path || "").split(".").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return;

  let cur: JsonContainer = root;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i]!;
    const last = i === parts.length - 1;
    const nextKey = parts[i + 1];
    const nextIsIndex = typeof nextKey === "string" && /^\d+$/.test(nextKey);
    const thisIsIndex = /^\d+$/.test(key);

    if (last) {
      if (Array.isArray(cur) && thisIsIndex) {
        (cur as unknown[])[Number(key)] = value;
      } else {
        (cur as Record<string, unknown>)[key] = value;
      }
      return;
    }

    // Traverse / create container.
    if (Array.isArray(cur) && thisIsIndex) {
      const idx = Number(key);
      const arr = cur as unknown[];
      const existing = arr[idx];
      if (!existing || typeof existing !== "object") {
        const created: JsonContainer = nextIsIndex ? [] : {};
        arr[idx] = created;
        cur = created;
      } else {
        cur = existing as JsonContainer;
      }
    } else {
      const obj = cur as Record<string, unknown>;
      const existing = obj[key];
      if (!existing || typeof existing !== "object") {
        const created: JsonContainer = nextIsIndex ? [] : {};
        obj[key] = created;
        cur = created;
      } else {
        cur = existing as JsonContainer;
      }
    }
  }
}

function normalizeAudioFormat(ext: string): string {
  const e = (ext || "").toLowerCase();
  if (e === "oga") return "ogg";
  if (e === "opus") return "ogg";
  if (e === "jpeg") return "jpg";
  // Common values: ogg, mp3, wav, mp4
  return e || "ogg";
}

type PendingChange = {
  id: string;
  chatId: number;
  fromId: number;
  createdAt: number;
  actions: CMSAction[];
  sourceText: string;
  // Optional: if the user request couldn't be mapped to a JSON action,
  // allow a one-tap fallback to the /code flow without retyping.
  tryCodeInstruction?: string;
  // Optional: clear an in-memory draft after commit completes.
  clearEventDraftChatId?: number;
  // Optional: "code edit flow" preview (committed on approval).
  codeEdit?: {
    title: string;
    summary: string;
    files: Array<{ path: string; content?: string; delete?: boolean }>;
  };
};

declare global {
  var __holdTelegramPending: Map<string, PendingChange> | undefined;
  var __holdTelegramEventDrafts: Map<number, EventDraft> | undefined;
}

const pendingStore: Map<string, PendingChange> =
  globalThis.__holdTelegramPending ?? (globalThis.__holdTelegramPending = new Map());

const PENDING_TTL_MS = 10 * 60 * 1000;

type EventDraft = {
  chatId: number;
  fromId: number;
  createdAt: number;
  title: string;
  notes: string;
  event: Partial<EventData>;
  gallery: EventGalleryItem[];
};

const eventDrafts: Map<number, EventDraft> =
  globalThis.__holdTelegramEventDrafts ?? (globalThis.__holdTelegramEventDrafts = new Map());

const EVENT_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

function pendingCleanup() {
  const now = Date.now();
  for (const [id, p] of pendingStore.entries()) {
    if (now - p.createdAt > PENDING_TTL_MS) pendingStore.delete(id);
  }
}

function eventDraftCleanup() {
  const now = Date.now();
  for (const [chatId, d] of eventDrafts.entries()) {
    if (now - d.createdAt > EVENT_DRAFT_TTL_MS) eventDrafts.delete(chatId);
  }
}

function pendingGet(id: string): PendingChange | null {
  pendingCleanup();
  const p = pendingStore.get(id);
  if (!p) return null;
  if (Date.now() - p.createdAt > PENDING_TTL_MS) {
    pendingStore.delete(id);
    return null;
  }
  return p;
}

function pendingClearChat(chatId: number) {
  for (const [id, p] of pendingStore.entries()) {
    if (p.chatId === chatId) pendingStore.delete(id);
  }
}

function eventDraftGet(chatId: number): EventDraft | null {
  eventDraftCleanup();
  const d = eventDrafts.get(chatId) || null;
  if (!d) return null;
  if (Date.now() - d.createdAt > EVENT_DRAFT_TTL_MS) {
    eventDrafts.delete(chatId);
    return null;
  }
  return d;
}

function eventDraftSet(draft: EventDraft) {
  eventDraftCleanup();
  eventDrafts.set(draft.chatId, draft);
}

function eventDraftClear(chatId: number) {
  eventDrafts.delete(chatId);
}

async function getTelegramFileBytes(fileId: string): Promise<{ file_path: string; bytes: ArrayBuffer }> {
  const url = new URL(`${TELEGRAM_API}/getFile`);
  url.searchParams.set("file_id", fileId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Telegram getFile failed (${res.status})`);
  const json = (await res.json()) as { ok: boolean; result?: { file_path?: string } };
  const file_path = json.result?.file_path;
  if (!file_path) throw new Error("Telegram getFile missing file_path");

  const fileRes = await fetch(`${TELEGRAM_FILE_API}/${file_path}`);
  if (!fileRes.ok) throw new Error(`Telegram file download failed (${fileRes.status})`);
  const bytes = await fileRes.arrayBuffer();
  return { file_path, bytes };
}

async function uploadTelegramMediaToGitHub(args: {
  fileId: string;
  caption: string;
  chatId: number;
  fromId?: number;
}): Promise<{ publicPath: string; commitSha: string; commitUrl?: string }> {
  const { file_path, bytes } = await getTelegramFileBytes(args.fileId);
  const ext = extFromPath(file_path) || "bin";
  const slug = slugify(args.caption || "upload") || String(Date.now());
  const ts = new Date().toISOString().slice(0, 10);
  // Avoid collisions for repeated uploads with similar/empty captions.
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const repoPath = `public/media/telegram/${ts}-${slug}-${unique}.${ext}`;

  const base64 = Buffer.from(new Uint8Array(bytes)).toString("base64");
  const res = await putGitHubBinaryFile({
    path: repoPath,
    base64,
    message: buildTelegramCommitMessage(`upload media (${repoPath})`, {
      fromId: args.fromId,
      requestText: args.caption,
    }),
  });

  return { publicPath: repoPath.replace(/^public/, ""), commitSha: res.commitSha, commitUrl: res.commitUrl };
}

function summarizeAction(act: CMSAction): string {
  switch (act.action) {
    case "update_section_field":
      return `• Set ${codeInline(`${act.section}.${act.field}`)} = ${codeInline(truncate(JSON.stringify(act.value)))}`;
    case "update_section":
      return `• Replace section ${codeInline(act.section)} (object)`;
    case "add_custom_section":
      return `• Add custom section ${codeInline(act.section.id || "(auto id)")}: ${escapeHtml(truncate(act.section.heading || "New section"))}`;
    case "update_custom_section":
      return `• Update custom section ${codeInline(act.id)}`;
    case "remove_custom_section":
      return `• Remove custom section ${codeInline(act.id)}`;
    case "reorder_custom_sections":
      return `• Reorder custom sections (${codeInline(String(act.ids.length))})`;
    case "add_team_member":
      return `• Add team member: <b>${escapeHtml(act.name)}</b> (${escapeHtml(act.role)})`;
    case "update_team_member":
      return `• Update team member: <b>${escapeHtml(act.name)}</b>`;
    case "remove_team_member":
      return `• Remove team member: <b>${escapeHtml(act.name)}</b>`;
    case "add_program":
      return `• Add programme: <b>${escapeHtml(act.title)}</b>`;
    case "update_program":
      return `• Update programme: <b>${escapeHtml(act.title)}</b>`;
    case "remove_program":
      return `• Remove programme: <b>${escapeHtml(act.title)}</b>`;
    case "add_initiative":
      return `• Add initiative: <b>${escapeHtml(act.title)}</b>`;
    case "remove_initiative":
      return `• Remove initiative: <b>${escapeHtml(act.title)}</b>`;
    case "add_gallery_image":
      return `• Add gallery image: <b>${escapeHtml(act.caption)}</b>`;
    case "remove_gallery_image":
      return `• Remove gallery image: <b>${escapeHtml(act.caption)}</b>`;
    case "add_event":
      return `• Add event: <b>${escapeHtml(String(act.event?.title || "event"))}</b>`;
    case "update_event":
      return `• Update event: ${codeInline(act.slug)}`;
    case "remove_event":
      return `• Remove event: ${codeInline(act.slug)}`;
    case "add_event_gallery_image":
      return `• Add photo to event gallery: ${codeInline(act.slug)}`;
    case "remove_event_gallery_image":
      return `• Remove photo from event gallery: ${codeInline(act.slug)}`;
    case "update_stat":
      return `• Update stat: <b>${escapeHtml(act.label)}</b> = ${codeInline(String(act.value))}`;
    case "remove_stat":
      return `• Remove stat: <b>${escapeHtml(act.label)}</b>`;
    case "undo":
      return "• Undo last change";
    case "get_status":
      return "• Status";
    case "unknown":
      return `• Unknown: ${escapeHtml(truncate(act.message))}`;
    default:
      return "• (unsupported action)";
  }
}

function isSupportedAction(act: unknown): act is CMSAction {
  if (!act || typeof act !== "object") return false;
  const a = (act as { action?: unknown }).action;
  if (typeof a !== "string") return false;
  // Keep in sync with applyAction() cases.
  return [
    "update_section_field",
    "update_section",
    "add_custom_section",
    "update_custom_section",
    "remove_custom_section",
    "reorder_custom_sections",
    "add_team_member",
    "update_team_member",
    "remove_team_member",
    "add_program",
    "update_program",
    "remove_program",
    "add_initiative",
    "remove_initiative",
    "add_gallery_image",
    "remove_gallery_image",
    "add_event",
    "update_event",
    "remove_event",
    "add_event_gallery_image",
    "remove_event_gallery_image",
    "update_stat",
    "remove_stat",
    "get_status",
    "undo",
    "unknown",
  ].includes(a);
}

function slugifyLoose(input: string): string {
  return slugify(String(input || ""));
}

function resolveEventSlug(events: EventData[], slugOrTitle: string): { slug: string } | { error: string } {
  const raw = String(slugOrTitle || "").trim();
  const target = normalize(raw);
  const targetSlug = slugifyLoose(raw);
  if (!raw) return { error: "Missing event identifier." };

  const exact = events.find((e) => normalize(e.slug) === target);
  if (exact) return { slug: exact.slug };

  // If user provides partial slug, allow unique prefix matches (e.g. talk-di-tingz -> talk-di-tingz-2025).
  const prefix = events.filter((e) => normalize(e.slug).startsWith(target + "-") || normalize(e.slug).startsWith(target));
  if (prefix.length === 1) return { slug: prefix[0]!.slug };

  // Try match by title tokens (or slugified title contains the hint).
  const byTitle = events.filter((e) => {
    const titleSlug = slugifyLoose(e.title);
    return titleSlug.includes(targetSlug) || normalize(e.title).includes(target);
  });
  if (byTitle.length === 1) return { slug: byTitle[0]!.slug };

  const candidates = [...new Set([...prefix, ...byTitle].map((e) => e.slug))].slice(0, 8);
  if (candidates.length) {
    return { error: `Event not found. Did you mean: ${candidates.map((s) => `"${s}"`).join(", ")}?` };
  }
  return { error: "Event not found. Use /event list to see available events." };
}

function mapSectionFieldAlias(section: string, field: string): string {
  const s = String(section || "");
  const f = String(field || "");
  if (s === "hero") {
    const heroMap: Record<string, string> = {
      // Common older/other-site schemas
      heading_highlight1: "heading_line1",
      heading_mid: "heading_line2",
      heading_highlight2: "heading_line3",
      title: "heading_line1",
      subtitle_1: "subtitle",
      subtitle_2: "subtitle2",
    };
    return heroMap[f] || f;
  }
  if (s === "contact") {
    const contactMap: Record<string, string> = {
      e_mail: "email",
      mail: "email",
      insta: "instagram",
      ig: "instagram",
      address: "location",
      addr: "location",
      telephone: "phone",
      mobile: "phone",
      phone_number: "phone",
    };
    return contactMap[f] || f;
  }
  return f;
}

function extractEventHintFromGalleryRequest(text: string): string | null {
  const s = String(text || "").trim();
  if (!s) return null;
  const m =
    s.match(/gallery\s+(?:in|for|to)\s+(.+?)(?:\s+in\s+events|\s+events|\s+event|\s*$)/i) ||
    s.match(/add\s+(?:this\s+)?to\s+gallery\s+in\s+(.+?)(?:\s+in\s+events|\s+events|\s+event|\s*$)/i) ||
    s.match(/\bin\s+(.+?)\s+in\s+events\b/i);
  const out = (m?.[1] || "").trim();
  return out || null;
}

function setOrAddContactItem(contact: Record<string, unknown>, label: string, updates: Partial<ContactItem>): Record<string, unknown> {
  const curItems = Array.isArray(contact.items) ? (contact.items as ContactItem[]) : [];
  const idx = curItems.findIndex((it) => normalize(String(it.label || "")) === normalize(label));
  const nextItems = [...curItems];
  if (idx === -1) {
    nextItems.push({
      label,
      value: updates.value ?? "",
      href: updates.href ?? null,
      icon: updates.icon ?? "",
    } as ContactItem);
  } else {
    nextItems[idx] = { ...nextItems[idx], ...updates } as ContactItem;
  }
  return { ...contact, items: nextItems };
}

function toMailto(email: string): string {
  const e = String(email || "").trim();
  return e ? `mailto:${e}` : "mailto:";
}

function toTelHref(phone: string): string {
  const raw = String(phone || "");
  const cleaned = raw.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : "tel:";
}

function toMapsHref(location: string): string {
  const raw = String(location || "").trim();
  if (!raw) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
}

function looksLikeEmail(s: string): boolean {
  const v = String(s || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function parseInstagram(raw: string): { value: string; href: string | null } {
  const s = String(raw || "").trim();
  if (!s) return { value: "", href: null };

  // URL form
  if (s.includes("instagram.com")) {
    try {
      const u = new URL(s.startsWith("http") ? s : `https://${s}`);
      const handle = u.pathname.split("/").filter(Boolean)[0] || "";
      if (/^[a-zA-Z0-9._]+$/.test(handle)) {
        return { value: `@${handle}`, href: `https://www.instagram.com/${handle}` };
      }
      return { value: s, href: s.startsWith("http") ? s : `https://${s}` };
    } catch {
      // fall through
    }
  }

  // Handle form
  const handle = s.startsWith("@") ? s.slice(1) : s;
  if (/^[a-zA-Z0-9._]+$/.test(handle)) {
    return { value: `@${handle}`, href: `https://www.instagram.com/${handle}` };
  }

  return { value: s, href: s.startsWith("http") ? s : null };
}

async function applyAction(
  action: CMSAction,
  meta?: CommitMeta
): Promise<{ description: string; commitSha: string; commitUrl?: string } | { error: string }> {
  try {
    switch (action.action) {
      case "update_section_field": {
        const { section, value } = action;
        const field = mapSectionFieldAlias(section, action.field);
        return await updateJsonFile<Record<string, unknown>>("src/data/sections.json", (data) => {
          const obj = (data[section] as Record<string, unknown>) || {};
          const next = { ...obj };

          // "Magic" aliases for contact updates.
          // The UI renders contact.items[]; users commonly say "change the email" which the model maps to contact.email.
          // We keep contact.email in sync but also update the Email item so the site actually changes.
          if (section === "contact" && field === "email" && typeof value === "string") {
            const email = value.trim();
            if (!looksLikeEmail(email)) {
              return { error: "That doesn't look like a valid email address." };
            }
            const updated = setOrAddContactItem(next, "Email", {
              value: email,
              href: toMailto(email),
              icon: "email",
            });
            // Keep legacy field too (even though UI uses items[]).
            (updated as Record<string, unknown>)["email"] = email;
            data[section] = updated;
            return { data, description: `set ${section}.${field}` };
          }
          if (section === "contact" && field === "instagram" && typeof value === "string") {
            const parsed = parseInstagram(value);
            if (!parsed.value) return { error: "Please provide an Instagram handle (e.g. @holditdowncic) or URL." };
            const updated = setOrAddContactItem(next, "Instagram", {
              value: parsed.value,
              href: parsed.href,
              icon: "instagram",
            });
            (updated as Record<string, unknown>)["instagram"] = parsed.value;
            data[section] = updated;
            return { data, description: `set ${section}.${field}` };
          }
          if (section === "contact" && field === "location" && typeof value === "string") {
            const loc = value.trim();
            if (!loc) return { error: "Please provide a location/address." };
            const updated = setOrAddContactItem(next, "Location", {
              value: loc,
              href: toMapsHref(loc) || null,
              icon: "location",
            });
            (updated as Record<string, unknown>)["location"] = loc;
            data[section] = updated;
            return { data, description: `set ${section}.${field}` };
          }
          if (section === "contact" && field === "phone" && typeof value === "string") {
            const phone = value.trim();
            if (!phone) return { error: "Please provide a phone number." };
            const updated = setOrAddContactItem(next, "Phone", {
              value: phone,
              href: toTelHref(phone),
              icon: "phone",
            });
            (updated as Record<string, unknown>)["phone"] = phone;
            data[section] = updated;
            return { data, description: `set ${section}.${field}` };
          }

          if (String(field || "").includes(".")) {
            setDeepValue(next, field, value);
          } else {
            next[field] = value;
          }
          data[section] = next;
          return { data, description: `set ${section}.${field}` };
        }, meta);
      }
      case "update_section": {
        const { section, content } = action;
        return await updateJsonFile<Record<string, unknown>>("src/data/sections.json", (data) => {
          data[section] = content;
          return { data, description: `replace section ${section}` };
        }, meta);
      }

      case "add_custom_section": {
        const { section } = action;
        return await updateJsonFile<Record<string, unknown>>("src/data/sections.json", (data) => {
          const raw = data["custom_sections"];
          const arr = (Array.isArray(raw) ? raw : []) as CustomSection[];
          const id = section.id || `custom-${Date.now()}`;
          const item: CustomSection = {
            id,
            section_label: section.section_label || "",
            heading: section.heading || "New section",
            body: Array.isArray(section.body) ? section.body : [],
            image: section.image ?? null,
            image_alt: section.image_alt || "",
            buttons: Array.isArray(section.buttons) ? section.buttons : [],
            layout: section.layout || (section.image ? "image_right" : "no_image"),
            bg: section.bg || "default",
            sort_order: typeof section.sort_order === "number" ? section.sort_order : nextSortOrder(arr),
          };
          const next = [...arr, item].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          data["custom_sections"] = next;
          return { data, description: `custom: add ${id}` };
        }, meta);
      }

      case "update_custom_section": {
        const { id, updates } = action;
        return await updateJsonFile<Record<string, unknown>>("src/data/sections.json", (data) => {
          const raw = data["custom_sections"];
          const arr = (Array.isArray(raw) ? raw : []) as CustomSection[];
          const idx = arr.findIndex((s) => s.id === id);
          if (idx === -1) return { data, description: `custom: '${id}' not found (no-op)` };
          const next = [...arr];
          next[idx] = { ...next[idx], ...updates };
          data["custom_sections"] = next;
          return { data, description: `custom: update ${id}` };
        }, meta);
      }

      case "remove_custom_section": {
        const { id } = action;
        return await updateJsonFile<Record<string, unknown>>("src/data/sections.json", (data) => {
          const raw = data["custom_sections"];
          const arr = (Array.isArray(raw) ? raw : []) as CustomSection[];
          data["custom_sections"] = arr.filter((s) => s.id !== id);
          return { data, description: `custom: remove ${id}` };
        }, meta);
      }

      case "reorder_custom_sections": {
        const { ids } = action;
        return await updateJsonFile<Record<string, unknown>>("src/data/sections.json", (data) => {
          const raw = data["custom_sections"];
          const arr = (Array.isArray(raw) ? raw : []) as CustomSection[];
          const map = new Map(arr.map((s) => [s.id, s]));
          const reordered: CustomSection[] = [];
          for (const id of ids) {
            const item = map.get(id);
            if (item) reordered.push(item);
          }
          for (const s of arr) {
            if (!ids.includes(s.id)) reordered.push(s);
          }
          const next = reordered.map((s, i) => ({ ...s, sort_order: i + 1 }));
          data["custom_sections"] = next;
          return { data, description: `custom: reorder (${next.length})` };
        }, meta);
      }

      case "add_team_member": {
        const { name, role, image_url } = action;
        return await updateJsonFile<TeamMember[]>("src/data/team.json", (data) => {
          const exists = data.find((m) => normalize(m.name) === normalize(name));
          if (exists) {
            return { data, description: `team: '${name}' already exists (no-op)` };
          }
          const item: TeamMember = {
            id: crypto.randomUUID(),
            name,
            role,
            image_url: image_url || null,
            sort_order: nextSortOrder(data),
          };
          return { data: [...data, item], description: `team: add ${name}` };
        }, meta);
      }
      case "update_team_member": {
        const { name, updates } = action;
        return await updateJsonFile<TeamMember[]>("src/data/team.json", (data) => {
          const idx = data.findIndex((m) => normalize(m.name) === normalize(name));
          if (idx === -1) return { data, description: `team: '${name}' not found (no-op)` };
          const next = [...data];
          next[idx] = { ...next[idx], ...updates };
          return { data: next, description: `team: update ${name}` };
        }, meta);
      }
      case "remove_team_member": {
        const { name } = action;
        return await updateJsonFile<TeamMember[]>("src/data/team.json", (data) => {
          const next = data.filter((m) => normalize(m.name) !== normalize(name));
          return { data: next, description: `team: remove ${name}` };
        }, meta);
      }

      case "add_program": {
        const { title, description, tags, image_url, image_alt } = action;
        return await updateJsonFile<Program[]>("src/data/programs.json", (data) => {
          const exists = data.find((p) => normalize(p.title) === normalize(title));
          if (exists) return { data, description: `programs: '${title}' already exists (no-op)` };
          const item: Program = {
            id: crypto.randomUUID(),
            title,
            description,
            tags,
            image_url: image_url || null,
            image_alt: image_alt || "",
            is_flagship: false,
            sort_order: nextSortOrder(data),
          };
          return { data: [...data, item], description: `programs: add ${title}` };
        }, meta);
      }
      case "update_program": {
        const { title, updates } = action;
        return await updateJsonFile<Program[]>("src/data/programs.json", (data) => {
          const idx = data.findIndex((p) => normalize(p.title) === normalize(title));
          if (idx === -1) return { data, description: `programs: '${title}' not found (no-op)` };
          const next = [...data];
          next[idx] = { ...next[idx], ...updates };
          return { data: next, description: `programs: update ${title}` };
        }, meta);
      }
      case "remove_program": {
        const { title } = action;
        return await updateJsonFile<Program[]>("src/data/programs.json", (data) => {
          const next = data.filter((p) => normalize(p.title) !== normalize(title));
          return { data: next, description: `programs: remove ${title}` };
        }, meta);
      }

      case "add_initiative": {
        const { title, detail } = action;
        return await updateJsonFile<Initiative[]>("src/data/initiatives.json", (data) => {
          const exists = data.find((i) => normalize(i.title) === normalize(title));
          if (exists) return { data, description: `initiatives: '${title}' already exists (no-op)` };
          const item: Initiative = {
            id: crypto.randomUUID(),
            title,
            detail,
            sort_order: nextSortOrder(data),
          };
          return { data: [...data, item], description: `initiatives: add ${title}` };
        }, meta);
      }
      case "remove_initiative": {
        const { title } = action;
        return await updateJsonFile<Initiative[]>("src/data/initiatives.json", (data) => {
          const next = data.filter((i) => normalize(i.title) !== normalize(title));
          return { data: next, description: `initiatives: remove ${title}` };
        }, meta);
      }

      case "add_gallery_image": {
        const { src, alt, caption } = action;
        return await updateJsonFile<GalleryImage[]>("src/data/gallery.json", (data) => {
          const item: GalleryImage = {
            id: crypto.randomUUID(),
            src,
            alt,
            caption,
            sort_order: nextSortOrder(data),
          };
          return { data: [...data, item], description: `gallery: add '${caption}'` };
        }, meta);
      }
      case "remove_gallery_image": {
        const { caption } = action;
        return await updateJsonFile<GalleryImage[]>("src/data/gallery.json", (data) => {
          const next = data.filter((g) => normalize(g.caption) !== normalize(caption));
          return { data: next, description: `gallery: remove '${caption}'` };
        }, meta);
      }

      case "add_event": {
        const evt = action.event || {};
        const title = (evt.title || "event").toString();
        return await updateJsonFile<EventData[]>("src/data/events.json", (data) => {
          const slug = (evt.slug ? String(evt.slug) : slugify(title)) || `event-${Date.now()}`;
          const exists = data.find((e) => e.slug === slug);
          if (exists) return { data, description: `events: '${slug}' already exists (no-op)` };
          const item: EventData = {
            id: crypto.randomUUID(),
            slug,
            title,
            date: String(evt.date || ""),
            location: String(evt.location || ""),
            description: String(evt.description || ""),
            highlights: Array.isArray(evt.highlights) ? (evt.highlights as string[]) : [],
            impact: Array.isArray(evt.impact) ? (evt.impact as string[]) : [],
            image: String(evt.image || ""),
            image_alt: String(evt.image_alt || ""),
            badge: String(evt.badge || ""),
            gallery: Array.isArray(evt.gallery) ? (evt.gallery as EventData["gallery"]) : [],
            sort_order: nextSortOrder(data),
          };
          return { data: [...data, item], description: `events: add ${slug}` };
        }, meta);
      }
      case "update_event": {
        const { slug, updates } = action;
        return await updateJsonFile<EventData[]>("src/data/events.json", (data) => {
          const resolved = resolveEventSlug(data, slug);
          if ("error" in resolved) return { error: resolved.error };
          const idx = data.findIndex((e) => e.slug === resolved.slug);
          if (idx === -1) return { error: `Event '${slug}' not found.` };
          const next = [...data];
          next[idx] = { ...next[idx], ...updates } as EventData;
          return { data: next, description: `events: update ${resolved.slug}` };
        }, meta);
      }
      case "remove_event": {
        const { slug } = action;
        return await updateJsonFile<EventData[]>("src/data/events.json", (data) => {
          const resolved = resolveEventSlug(data, slug);
          if ("error" in resolved) return { error: resolved.error };
          const next = data.filter((e) => e.slug !== resolved.slug);
          if (next.length === data.length) return { error: `Event '${slug}' not found.` };
          return { data: next, description: `events: remove ${resolved.slug}` };
        }, meta);
      }

      case "add_event_gallery_image": {
        const { slug, src, alt } = action;
        return await updateJsonFile<EventData[]>("src/data/events.json", (data) => {
          const resolved = resolveEventSlug(data, slug);
          if ("error" in resolved) return { error: resolved.error };
          const idx = data.findIndex((e) => e.slug === resolved.slug);
          if (idx === -1) return { error: `Event '${slug}' not found.` };
          const next = [...data];
          const cur = next[idx]!;
          const gallery = Array.isArray(cur.gallery) ? cur.gallery : [];
          const already = gallery.some((g) => g?.src === src);
          const appended = already ? gallery : [...gallery, { src, alt: alt || `${cur.title} photo` }];
          next[idx] = {
            ...cur,
            // If the event has no hero image yet, set it to this image.
            image: cur.image || src,
            image_alt: cur.image_alt || (alt || `${cur.title} photo`),
            gallery: appended,
          } as EventData;
          return { data: next, description: `events: add photo to ${resolved.slug}` };
        }, meta);
      }

      case "remove_event_gallery_image": {
        const { slug, src, alt } = action;
        return await updateJsonFile<EventData[]>("src/data/events.json", (data) => {
          const resolved = resolveEventSlug(data, slug);
          if ("error" in resolved) return { error: resolved.error };
          const idx = data.findIndex((e) => e.slug === resolved.slug);
          if (idx === -1) return { error: `Event '${slug}' not found.` };
          const next = [...data];
          const cur = next[idx]!;
          const gallery = Array.isArray(cur.gallery) ? cur.gallery : [];
          const nextGallery = gallery.filter((g) => {
            if (src && g?.src === src) return false;
            if (alt && normalize(String(g?.alt || "")) === normalize(alt)) return false;
            return true;
          });
          if (nextGallery.length === gallery.length) return { error: "No matching photo found in that event gallery." };
          next[idx] = { ...cur, gallery: nextGallery } as EventData;
          return { data: next, description: `events: remove photo from ${resolved.slug}` };
        }, meta);
      }

      case "update_stat": {
        const { label, value, suffix, prefix } = action;
        return await updateJsonFile<Stat[]>("src/data/stats.json", (data) => {
          const idx = data.findIndex((s) => normalize(s.label) === normalize(label));
          if (idx === -1) {
            const item: Stat = {
              id: crypto.randomUUID(),
              label,
              value,
              suffix: suffix || "",
              prefix: prefix || "",
              duration: 1200,
              sort_order: nextSortOrder(data),
            };
            return { data: [...data, item], description: `stats: add ${label}` };
          }
          const next = [...data];
          next[idx] = {
            ...next[idx],
            value,
            suffix: suffix ?? next[idx].suffix,
            prefix: prefix ?? next[idx].prefix,
          };
          return { data: next, description: `stats: update ${label}` };
        }, meta);
      }
      case "remove_stat": {
        const { label } = action;
        return await updateJsonFile<Stat[]>("src/data/stats.json", (data) => {
          const next = data.filter((s) => normalize(s.label) !== normalize(label));
          return { data: next, description: `stats: remove ${label}` };
        }, meta);
      }

      default:
        return { error: `Unsupported action: ${action.action}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

async function handleHelp(chatId: number) {
  const msg = [
    "<b>Hold It Down Website Bot</b>",
    "",
    "📝 <b>Text</b>: “Update hero subtitle to …”",
    "🖼️ <b>Photo</b>: send image + caption (“use this as hero image” / “add to gallery”)",
    "📸 <b>Screenshot</b>: send screenshot + caption describing what to change",
    "🎙️ <b>Voice</b>: send a voice note describing the change",
    "",
    `Tip: use ${codeInline("/helper")} for event drafting + more examples.`,
    "",
    "<b>Commands</b>",
    `• ${codeInline("/sections")} list editable sections`,
    `• ${codeInline("/status")} recent Telegram commit`,
    `• ${codeInline("/undo")} undo last Telegram change`,
    `• ${codeInline("/revert")} same as /undo`,
    `• ${codeInline("/reset")} clear pending preview`,
    `• ${codeInline("/event")} create an event draft (then add photos)`,
    "",
    "<b>Hide sections (homepage)</b>",
    `• ${codeInline("/set site.hidden_sections [\"impact\",\"team\"]")} (example)`,
    "",
    "<b>Power commands</b>",
    `• ${codeInline("/set hero.badge \"...\"")}`,
    `• ${codeInline("/replace hero {\"badge\":\"...\"}")}`,
    `• ${codeInline("/apply {\"actions\":[...]}")}`,
    "",
    "Tip: after you send a request, you’ll get a <b>Preview</b> with ✅ Commit / ❌ Cancel.",
  ].join("\n");
  await sendTelegram(chatId, msg);
}

async function handleStart(chatId: number) {
  const msg = [
    "👋 <b>Welcome</b>",
    "",
    "Send me a message describing what you want to change on the site. I’ll show a <b>Preview</b> and you can ✅ Commit or ❌ Cancel.",
    "",
    "<b>Event workflow (write the article first, add photos after)</b>",
    `1) ${codeInline("/event start Marcus | Date: 2026-03-10. Location: Croydon. Notes: family fun day.")}`,
    "2) Send photos (no caption needed) to attach them to the draft",
    `3) ${codeInline("/event status")} to review`,
    `4) ${codeInline("/event publish")} to create the event`,
    `5) ${codeInline("/event cancel")} to discard the draft`,
    "",
    "<b>Other inputs</b>",
    "📝 Text: “Change hero headline to …”",
    "📸 Screenshot + caption: “Change this heading to …”",
    "🎙️ Voice note: describe the change",
    "🖼️ Photo + caption: “use this as hero image” / “add to gallery”",
    "",
    `More examples: ${codeInline("/helper")}`,
    "",
    `Advanced: ${codeInline("/code <instruction>")} makes code/layout changes and (after your approval) commits directly to <b>main</b>.`,
  ].join("\n");
  await sendTelegram(chatId, msg);
}

async function handleHelper(chatId: number) {
  const msg = [
    "🧰 <b>Helper</b>",
    "",
    "<b>Create an event (article text)</b>",
    `• ${codeInline("/event start <title> | optional notes")}`,
    "Example:",
    `• ${codeInline("/event start Marcus | A youth sports day celebrating teamwork. Date: 2026-06-14. Location: Croydon.")}`,
    "",
    "<b>Add photos to that event</b>",
    "• After starting a draft, just send photos (caption optional). I’ll upload them and attach them to the draft gallery.",
    "",
    "<b>Publish / check</b>",
    `• ${codeInline("/event status")}`,
    `• ${codeInline("/event publish")}`,
    `• ${codeInline("/event cancel")}`,
    "",
    "<b>Edit the rest of the website</b>",
    `• ${codeInline("/sections")} then message: “Update mission title to …”`,
    "• Or send a screenshot + caption so I can find the right section.",
    "",
    "<b>Code changes (advanced)</b>",
    `• ${codeInline("/code <what to change>")} shows a preview, then commits to main if you approve`,
  ].join("\n");
  await sendTelegram(chatId, msg);
}

async function handleCodeHelp(chatId: number) {
  const msg = [
    "<b>Code Edit Flow</b>",
    "",
    "Use this for layout/styling/component changes that aren't backed by JSON yet.",
    "It shows a preview, then commits directly to <b>main</b> if you approve (and Vercel deploys).",
    "Note: the preview is summary-only (no code shown).",
    "",
    "<b>Usage</b>",
    `• ${codeInline("/code <instruction>")}`,
    "",
    "<b>Examples</b>",
    `• ${codeInline("/code Make the donate button green and add hover shadow")}`,
    `• ${codeInline("/code On /events, make the title smaller on mobile")}`,
    `• ${codeInline("/code Add a new section component for Partners and link it in the nav")}`,
    "",
    "After preview you can ✅ Commit or ❌ Cancel.",
  ].join("\n");
  await sendTelegram(chatId, msg);
}

async function handleCodeRequest(chatId: number, fromId: number, instruction: string) {
  const trimmed = instruction.trim();
  if (!trimmed) {
    await handleCodeHelp(chatId);
    return;
  }

  await sendChatAction(chatId, "typing");
  const plan = await planCodeEdit(trimmed);
  if ("error" in plan) {
    await sendTelegram(chatId, `❌ Code planner failed: ${codeInline(plan.error)}`);
    return;
  }

  if (!Array.isArray(plan.files) || plan.files.length === 0) {
    await sendTelegram(
      chatId,
      [
        "🤔 I couldn’t figure out which files to change.",
        plan.summary ? `\n${escapeHtml(plan.summary)}` : "",
        "",
        `Try again with more detail, or use ${codeInline("/code help")}.`,
      ].join("\n")
    );
    return;
  }

  const files = plan.files.slice(0, 5);
  const invalid = files.find((f) => !isAllowedCodePath(String(f.path || "")));
  if (invalid) {
    await sendTelegram(
      chatId,
      `❌ Refusing to edit disallowed path: ${codeInline(String(invalid.path || ""))}`
    );
    return;
  }
  const badOp = files.find((f) => !["update", "create", "delete"].includes(String(f.op)));
  if (badOp) {
    await sendTelegram(chatId, "❌ Planner returned an invalid operation. Try again with a simpler request.");
    return;
  }

  // Materialize file contents.
  const materialized: Array<{ path: string; content?: string; delete?: boolean }> = [];
  let totalBytes = 0;
  for (const f of files) {
    const op = f.op as "update" | "create" | "delete";
    const path = String(f.path);
    if (op === "delete") {
      materialized.push({ path, delete: true });
      continue;
    }

    let existing = "";
    if (op === "update") {
      try {
        const cur = await getGitHubFile(path);
        existing = cur.text;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        await sendTelegram(chatId, `❌ Could not read ${codeInline(path)}: ${codeInline(msg)}`);
        return;
      }
    }

    const gen = await generateFileContent({
      instruction: trimmed,
      path,
      op,
      existing,
    });
    if ("error" in gen) {
      await sendTelegram(chatId, `❌ Generator failed for ${codeInline(path)}: ${codeInline(gen.error)}`);
      return;
    }
    if (gen.content.length > 220_000) {
      await sendTelegram(chatId, `❌ Generated file too large for ${codeInline(path)}. Please narrow the request.`);
      return;
    }
    totalBytes += gen.content.length;
    if (totalBytes > 450_000) {
      await sendTelegram(chatId, "❌ Generated too much code for a single preview. Please narrow the request.");
      return;
    }
    materialized.push({ path, content: gen.content });
  }

  const previewId = crypto.randomUUID().slice(0, 12);
  pendingStore.set(previewId, {
    id: previewId,
    chatId,
    fromId,
    createdAt: Date.now(),
    actions: [],
    sourceText: trimmed,
    codeEdit: {
      title: plan.title || "Code update",
      summary: plan.summary || "",
      files: materialized,
    },
  });

  const updates = materialized.filter((m) => !m.delete).length;
  const deletes = materialized.filter((m) => m.delete).length;
  const fileSummary =
    deletes > 0
      ? `${updates} update${updates === 1 ? "" : "s"}, ${deletes} delete${deletes === 1 ? "" : "s"}`
      : `${updates} update${updates === 1 ? "" : "s"}`;

  const previewMsg = [
    "🧩 <b>Preview (Code)</b>",
    plan.title ? `<b>${escapeHtml(plan.title)}</b>` : "",
    plan.summary ? escapeHtml(truncate(plan.summary, 420)) : "",
    "",
    `<b>Changes</b>: ${escapeHtml(fileSummary)}`,
    "No code will be shown here.",
    "",
    "⚠️ This will commit directly to <b>main</b> if you approve.",
    "",
    "<b>Ready to commit?</b>",
  ].filter(Boolean).join("\n");

  await sendTelegram(
    chatId,
    previewMsg,
    [
      [
        { text: "✅ Yes, Commit", callback_data: `commit:${previewId}` },
        { text: "❌ No, Cancel", callback_data: `cancel:${previewId}` },
      ],
    ]
  );
}

function formatEventDraft(d: EventDraft): string {
  const slug = String(d.event.slug || slugify(d.title) || "");
  const date = String(d.event.date || "");
  const location = String(d.event.location || "");
  const highlights = Array.isArray(d.event.highlights) ? d.event.highlights : [];
  const impact = Array.isArray(d.event.impact) ? d.event.impact : [];
  return [
    "🗓️ <b>Event Draft</b>",
    `Title: <b>${escapeHtml(d.title)}</b>`,
    slug ? `Slug: ${codeInline(slug)}` : "",
    date ? `Date: ${escapeHtml(date)}` : "Date: (not set)",
    location ? `Location: ${escapeHtml(location)}` : "Location: (not set)",
    `Photos attached: <b>${String(d.gallery.length)}</b>`,
    `Highlights: <b>${String(highlights.length)}</b>`,
    `Impact: <b>${String(impact.length)}</b>`,
  ].filter(Boolean).join("\n");
}

async function handleEventStatus(chatId: number) {
  const d = eventDraftGet(chatId);
  if (!d) {
    await sendTelegram(chatId, `No active event draft. Start one with ${codeInline("/event start <title>")}.`);
    return;
  }
  await sendTelegram(
    chatId,
    [
      formatEventDraft(d),
      "",
      `Next: send photos, then ${codeInline("/event publish")}.`,
    ].join("\n"),
    [[
      { text: "✅ Publish", callback_data: "event:publish" },
      { text: "📋 Status", callback_data: "event:status" },
      { text: "🗑️ Cancel", callback_data: "event:cancel" },
    ]]
  );
}

async function handleEventCancel(chatId: number) {
  const d = eventDraftGet(chatId);
  if (!d) {
    await sendTelegram(chatId, "No active event draft to cancel.");
    return;
  }
  eventDraftClear(chatId);
  await sendTelegram(chatId, `🗑️ Cancelled event draft: <b>${escapeHtml(d.title)}</b>.`);
}

async function handleEventStart(chatId: number, fromId: number, argText: string) {
  const raw = argText.trim();
  if (!raw) {
    await sendTelegram(chatId, `Usage: ${codeInline("/event start <title> | optional notes")}`);
    return;
  }

  const pipe = raw.indexOf("|");
  const title = (pipe === -1 ? raw : raw.slice(0, pipe)).trim();
  const notes = (pipe === -1 ? "" : raw.slice(pipe + 1)).trim();
  if (!title) {
    await sendTelegram(chatId, `Usage: ${codeInline("/event start <title> | optional notes")}`);
    return;
  }

  await sendChatAction(chatId, "typing");

  const prompt = [
    `Create a new event titled "${title}".`,
    notes ? `Notes: ${notes}` : "",
    "Write a warm description (2-4 sentences).",
    "Provide 4-6 highlights and 2-4 impact bullets.",
    "If date/location are NOT explicitly provided, leave date and location as empty strings.",
    "Set a short badge (1-3 words).",
    "Do NOT set image/image_alt. Do NOT set gallery.",
    "Return an add_event action.",
  ].filter(Boolean).join("\n");

  const actions = await parseCommand(prompt);
  const add = actions.find((a) => a.action === "add_event") as { action: "add_event"; event: Partial<EventData> } | undefined;
  const unk = actions.find((a) => a.action === "unknown") as { action: "unknown"; message: string } | undefined;

  if (!add) {
    await sendTelegram(
      chatId,
      [
        "🤔 I couldn’t generate an event draft from that.",
        unk?.message ? `\n${escapeHtml(unk.message)}` : "",
        "",
        `Try: ${codeInline("/event start Marcus | Date: 2026-06-14. Location: Croydon. Notes: ...")}`,
      ].join("\n")
    );
    return;
  }

  const slug = (add.event.slug ? String(add.event.slug) : slugify(title)) || `event-${Date.now()}`;
  const draft: EventDraft = {
    chatId,
    fromId,
    createdAt: Date.now(),
    title,
    notes,
    event: {
      ...add.event,
      title,
      slug,
      image: "",
      image_alt: "",
      gallery: [],
      highlights: Array.isArray(add.event.highlights) ? add.event.highlights : [],
      impact: Array.isArray(add.event.impact) ? add.event.impact : [],
    },
    gallery: [],
  };
  eventDraftSet(draft);

  await sendTelegram(
    chatId,
    [
      "✅ <b>Draft created</b>",
      "",
      formatEventDraft(draft),
      "",
      "Now send photos (caption optional) to attach them to this event.",
      `When ready: ${codeInline("/event publish")}`,
    ].join("\n"),
    [[
      { text: "📋 Status", callback_data: "event:status" },
      { text: "✅ Publish", callback_data: "event:publish" },
      { text: "🗑️ Cancel", callback_data: "event:cancel" },
    ]]
  );
}

async function handleEventPublish(chatId: number, fromId: number) {
  const d = eventDraftGet(chatId);
  if (!d) {
    await sendTelegram(chatId, `No active event draft. Start one with ${codeInline("/event start <title>")}.`);
    return;
  }
  if (d.fromId !== fromId) {
    await sendTelegram(chatId, "This draft was created by a different user. Start a new draft in this chat.");
    return;
  }

  const firstPhoto = d.gallery[0];
  const event: Partial<EventData> = {
    ...d.event,
    title: d.title,
    slug: String(d.event.slug || slugify(d.title) || `event-${Date.now()}`),
    gallery: d.gallery,
    image: String(d.event.image || firstPhoto?.src || ""),
    image_alt: String(d.event.image_alt || firstPhoto?.alt || ""),
  };

  const previewId = crypto.randomUUID().slice(0, 12);
  pendingStore.set(previewId, {
    id: previewId,
    chatId,
    fromId,
    createdAt: Date.now(),
    actions: [{ action: "add_event", event }],
    sourceText: `event publish: ${d.title}`,
    clearEventDraftChatId: chatId,
  });

  const previewMsg = [
    "📝 <b>Preview</b>",
    "",
    summarizeAction({ action: "add_event", event }),
    "",
    "<b>Ready to commit?</b>",
  ].join("\n");

  await sendTelegram(
    chatId,
    previewMsg,
    [[
      { text: "✅ Yes, Commit", callback_data: `commit:${previewId}` },
      { text: "❌ No, Cancel", callback_data: `cancel:${previewId}` },
    ]]
  );
}

async function handleEventCommand(chatId: number, fromId: number, normalizedText: string) {
  const parts = normalizedText.trim().split(/\s+/);
  const base = (parts[0] || "").toLowerCase();
  if (base !== "/event") return;

  const sub = (parts[1] || "help").toLowerCase();
  const rest = parts.slice(2).join(" ").trim();

  switch (sub) {
    case "start":
    case "draft":
      await handleEventStart(chatId, fromId, rest);
      return;
    case "list": {
      try {
        const events = await getGitHubFile("src/data/events.json");
        const parsed = JSON.parse(events.text) as EventData[];
        const items = (Array.isArray(parsed) ? parsed : []).slice(0, 15);
        await sendTelegram(
          chatId,
          [
            "🗓️ <b>Events</b>",
            "",
            items.length
              ? items.map((e) => `• ${codeInline(String(e.slug))} — ${escapeHtml(String(e.title || ""))}`).join("\n")
              : "(none)",
            "",
            "Tip: say “add this to gallery in <event name>” with a photo attached.",
          ].join("\n")
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        await sendTelegram(chatId, `Failed to list events: ${codeInline(msg)}`);
      }
      return;
    }
    case "status":
      await handleEventStatus(chatId);
      return;
    case "publish":
      await handleEventPublish(chatId, fromId);
      return;
    case "cancel":
      await handleEventCancel(chatId);
      return;
    case "help":
    default:
      await sendTelegram(
        chatId,
        [
          "<b>/event</b> commands",
          `• ${codeInline("/event start <title> | optional notes")}`,
          `• ${codeInline("/event list")} list existing events`,
          `• ${codeInline("/event status")}`,
          `• ${codeInline("/event publish")}`,
          `• ${codeInline("/event cancel")}`,
          "",
          `Tip: ${codeInline("/helper")}`,
        ].join("\n")
      );
      return;
  }
}

async function handleStatus(chatId: number) {
  try {
    const siteUrl = (process.env.SITE_URL || "https://www.holditdown.uk").replace(/\/$/, "");
    const commits = await listRecentCommits(10);
    const last = commits.find((c) => c.commit.message.startsWith("telegram:"));
    let deployLine = "";
    let deployUrl: string | null = null;
    let liveLine = "";
    if (last) {
      try {
        const st = await getCommitStatus(last.sha);
        const vercel = pickVercelStatus(st.statuses);
        deployLine = `Deploy: <b>${fmtState(vercel?.state || st.state)}</b>`;
        deployUrl = vercel?.target_url || null;
      } catch {
        // ignore
      }
    }

    // Also show what commit is actually live on the production site.
    if (siteUrl) {
      try {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), 3000);
        const res = await fetch(`${siteUrl}/api/deploy-info`, { signal: ac.signal, cache: "no-store" });
        clearTimeout(t);
        if (res.ok) {
          const info = (await res.json()) as {
            vercel?: { git?: { sha?: string | null; message?: string | null } | null } | null;
          };
          const liveSha = info?.vercel?.git?.sha || null;
          const liveMsg = info?.vercel?.git?.message || null;
          if (liveSha) {
            liveLine = `Live site SHA: <code>${liveSha.slice(0, 7)}</code>`;
            if (last && liveSha !== last.sha) {
              liveLine += `\n⚠️ Live site is on a different commit than your last Telegram change. Wait ~2 min, then tap Deploy status.`;
            } else if (liveMsg) {
              liveLine += `\nLive message: ${escapeHtml(truncate(liveMsg, 160))}`;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    const msg = [
      "<b>Status</b>",
      `GitHub branch edits: <code>${process.env.GITHUB_OWNER || "holditdowncic"}/${process.env.GITHUB_REPO || "hold"}:${process.env.GITHUB_BRANCH || "main"}</code>`,
      last ? `Last Telegram commit: <code>${last.sha.slice(0, 7)}</code>` : "Last Telegram commit: (none found)",
      deployLine,
      liveLine,
      "",
      "Vercel: should auto-deploy when GitHub receives the commit (if the project is linked).",
    ].join("\n");
    const buttons: TelegramInlineButton[][] = [];
    if (last) buttons.push([{ text: "🔎 Deploy status", callback_data: `deploy:${last.sha}` }]);
    if (deployUrl) buttons.push([{ text: "View Deploy", url: deployUrl }]);
    if (siteUrl) buttons.push([{ text: "View Live Site", url: siteUrl }]);
    await sendTelegram(chatId, msg, buttons.length ? buttons : undefined, { disablePreview: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await sendTelegram(chatId, `Status failed: ${codeInline(msg)}`);
  }
}

async function handleUndo(chatId: number) {
  try {
    const commits = await listRecentCommits(20);
    const last = commits.find((c) => c.commit.message.startsWith("telegram:") && !c.commit.message.startsWith("telegram: revert"));
    if (!last) {
      await sendTelegram(chatId, "No recent Telegram commit found to undo.");
      return;
    }
    const res = await revertCommit(last.sha);
    await sendTelegram(
      chatId,
      `Reverted ${codeInline(last.sha.slice(0, 7))}.\nFiles: ${res.revertedFiles.map((f) => codeInline(f)).join(", ")}`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await sendTelegram(chatId, `Undo failed: ${codeInline(msg)}`);
  }
}

async function handleSections(chatId: number) {
  try {
    const sections = await getGitHubFile("src/data/sections.json");
    const parsed = JSON.parse(sections.text) as Record<string, unknown>;
    const keys = Object.keys(parsed).filter((k) => k !== "custom_sections").sort();
    const custom = Array.isArray(parsed.custom_sections) ? (parsed.custom_sections as Array<{ id?: string; heading?: string }>) : [];
    const msg = [
      "📂 <b>Editable Sections</b>",
      "",
      keys.map((k) => `• ${codeInline(k)}`).join("\n") || "(none)",
      "",
      "🧩 <b>Custom Sections</b>",
      custom.length
        ? custom
            .slice(0, 15)
            .map((s) => `• ${codeInline(String(s.id || ""))} — ${escapeHtml(truncate(String(s.heading || "")))}`)
            .join("\n")
        : "(none yet)",
      "",
      "Example: “Add a new section called Donations with a button to /contact”",
    ].join("\n");
    await sendTelegram(chatId, msg);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await sendTelegram(chatId, `Sections failed: ${codeInline(msg)}`);
  }
}

export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = await request.json();

    // Callback buttons
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = String(cb.data || "");
      const chatId = cb.message?.chat?.id as number | undefined;
      const fromId = cb.from?.id as number | undefined;
      if (!chatId || !fromId || !isAdmin(fromId)) {
        // Ignore non-admin callbacks. Responding to arbitrary callback IDs can cause noisy failures.
        return NextResponse.json({ ok: true });
      }

      if (data === "event:status") {
        await answerCallback(cb.id, "Opening draft...");
        await handleEventStatus(chatId);
        return NextResponse.json({ ok: true });
      }
      if (data === "event:cancel") {
        await answerCallback(cb.id, "Cancelling...");
        await handleEventCancel(chatId);
        return NextResponse.json({ ok: true });
      }
      if (data === "event:publish") {
        await answerCallback(cb.id, "Preparing preview...");
        await handleEventPublish(chatId, fromId);
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("treeok:") || data.startsWith("treeno:")) {
        const approving = data.startsWith("treeok:");
        const submissionId = data.slice((approving ? "treeok:" : "treeno:").length).trim();
        await answerCallback(cb.id, approving ? "Approving tree post..." : "Rejecting tree post...");
        try {
          const contribution = await updateTreeContributionStatus(
            submissionId,
            approving ? "approved" : "rejected",
            fromId,
          );
          await sendTelegram(
            chatId,
            [
              approving ? "✅ <b>Tree post approved</b>" : "❌ <b>Tree post rejected</b>",
              `Part: <b>${escapeHtml(treeZoneLabel(contribution.zoneId))}</b>`,
              `From: ${escapeHtml(contribution.author || "Community voice")}`,
              contribution.message ? `Message: ${escapeHtml(truncate(contribution.message, 220))}` : "Message: <i>voice note only</i>",
              approving ? "It will now appear on the public Tree of Hope." : "It will stay hidden from the public tree.",
            ].filter(Boolean).join("\n"),
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          await sendTelegram(chatId, `Tree approval failed: ${codeInline(msg)}`);
        }
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("prmerge:")) {
        const num = Number(data.slice("prmerge:".length).trim());
        await answerCallback(cb.id, "Merging PR...");
        try {
          const pr = await getPullRequest({ number: num });
          const title = `telegram: code: merge PR #${num}`;
          const message = `Merged PR #${num} via Telegram bot.`;
          const merged = await mergePullRequest({ number: num, title, message, method: "squash" });
          const sha = merged.sha || "";

          const buttons: TelegramInlineButton[][] = [];
          if (pr.html_url) buttons.push([{ text: "View PR", url: pr.html_url }]);
          if (sha) buttons.push([{ text: "↩️ Undo", callback_data: `undo:${sha}` }]);
          const siteUrl = process.env.SITE_URL || "https://www.holditdown.uk";
          if (siteUrl) buttons.push([{ text: "View Live Site", url: siteUrl }]);
          if (sha) buttons.push([{ text: "🔎 Deploy status", callback_data: `deploy:${sha}` }]);

          await sendTelegram(
            chatId,
            [
              "✅ <b>Merged</b>",
              `PR #${num}`,
              sha ? `SHA: ${codeInline(sha.slice(0, 7))}` : "",
              "",
              "⏳ Deploying... (~1–2 min)",
            ].filter(Boolean).join("\n"),
            buttons.length ? buttons : undefined,
            { disablePreview: true }
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          await sendTelegram(chatId, `❌ Merge failed: ${codeInline(msg)}`);
        }
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("prclose:")) {
        const num = Number(data.slice("prclose:".length).trim());
        await answerCallback(cb.id, "Closing PR...");
        try {
          const pr = await getPullRequest({ number: num });
          await closePullRequest({ number: num });
          await sendTelegram(chatId, `❌ Closed PR #${num}.\n${pr.html_url ? `PR: ${pr.html_url}` : ""}`.trim(), undefined, {
            disablePreview: true,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          await sendTelegram(chatId, `❌ Close PR failed: ${codeInline(msg)}`);
        }
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("deploy:")) {
        const sha = data.slice("deploy:".length).trim();
        await answerCallback(cb.id, "Checking deploy status...");
        try {
          const summary = await getCommitStatus(sha);
          const vercel = pickVercelStatus(summary.statuses);
          const state = vercel?.state || summary.state;

          const msg = [
            "🚀 <b>Deployment</b>",
            `SHA: ${codeInline(sha.slice(0, 7))}`,
            `Status: <b>${fmtState(state)}</b>`,
            vercel?.description ? `Note: ${escapeHtml(truncate(vercel.description, 220))}` : "",
          ].filter(Boolean).join("\n");

          const buttons: TelegramInlineButton[][] = [];
          if (vercel?.target_url) buttons.push([{ text: "View Deploy", url: vercel.target_url }]);
          const siteUrl = process.env.SITE_URL || "https://www.holditdown.uk";
          if (siteUrl) buttons.push([{ text: "View Live Site", url: siteUrl }]);
          buttons.push([{ text: "🔄 Refresh", callback_data: `deploy:${sha}` }]);

          await sendTelegram(chatId, msg, buttons, { disablePreview: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          await sendTelegram(chatId, `Deploy status failed: ${codeInline(msg)}`);
        }
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("commit:")) {
        const id = data.slice("commit:".length).trim();
        const pending = pendingGet(id);
        if (!pending) {
          await answerCallback(cb.id, "Expired. Please resend your request.");
          await sendTelegram(chatId, "⏱️ Preview expired. Please resend your request.");
          return NextResponse.json({ ok: true });
        }

        await answerCallback(cb.id, "Committing...");
        pendingStore.delete(id);

        const siteUrl = process.env.SITE_URL || "https://www.holditdown.uk";

        if (pending.codeEdit) {
          try {
            const branch = process.env.GITHUB_BRANCH || "main";
            const title = pending.codeEdit.title || "Code update";
            const commitMessage = buildTelegramCommitMessage(`code: ${title}`, {
              fromId: pending.fromId,
              requestText: pending.sourceText,
            });

            const res = await createCommitWithFiles({
              branch,
              message: commitMessage,
              files: pending.codeEdit.files,
            });

            const buttons: TelegramInlineButton[][] = [
              [{ text: "↩️ Undo", callback_data: `undo:${res.commitSha}` }],
            ];
            if (res.commitUrl) buttons.push([{ text: "View Commit", url: res.commitUrl }]);
            if (siteUrl) buttons.push([{ text: "View Live Site", url: siteUrl }]);
            buttons.push([{ text: "🔎 Deploy status", callback_data: `deploy:${res.commitSha}` }]);

            await sendTelegram(
              chatId,
              [
                "✅ <b>Committed (Code)</b>",
                `• ${escapeHtml(title)}`,
                `• SHA: ${codeInline(res.commitSha.slice(0, 7))}`,
                "",
                "⏳ Deploying... (~1–2 min)",
                "Tip: tap <b>Deploy status</b> to check progress.",
              ].join("\n"),
              buttons,
              { disablePreview: true }
            );
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            await sendTelegram(chatId, `Failed: ${codeInline(msg)}`);
          }

          return NextResponse.json({ ok: true });
        }

        for (const act of pending.actions) {
          if (act.action === "unknown") {
            await sendTelegram(chatId, `Could not parse: ${escapeHtml((act as { message: string }).message)}`);
            continue;
          }
          const res = await applyAction(act, { fromId: pending.fromId, requestText: pending.sourceText });
          if ("error" in res) {
            await sendTelegram(chatId, `Failed: ${codeInline(res.error)}`);
            continue;
          }

          const buttons: TelegramInlineButton[][] = [
            [{ text: "↩️ Undo", callback_data: `undo:${res.commitSha}` }],
          ];
          if (res.commitUrl) {
            buttons.push([{ text: "View Commit", url: res.commitUrl }]);
          }
          if (siteUrl) {
            buttons.push([{ text: "View Live Site", url: siteUrl }]);
          }
          buttons.push([{ text: "🔎 Deploy status", callback_data: `deploy:${res.commitSha}` }]);

          await sendTelegram(
            chatId,
            [
              "✅ <b>Committed</b>",
              `• ${escapeHtml(res.description)}`,
              `• SHA: ${codeInline(res.commitSha.slice(0, 7))}`,
              "",
              "⏳ Deploying... (~1–2 min)",
              "Tip: tap <b>Deploy status</b> to check progress.",
            ].join("\n"),
            buttons,
            { disablePreview: true }
          );
        }

        if (pending.clearEventDraftChatId) {
          eventDraftClear(pending.clearEventDraftChatId);
        }

        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("cancel:")) {
        const id = data.slice("cancel:".length).trim();
        pendingStore.delete(id);
        await answerCallback(cb.id, "Cancelled");
        await sendTelegram(chatId, "❌ Cancelled. Send a new request when ready.");
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("undo:")) {
        const sha = data.slice("undo:".length).trim();
        await answerCallback(cb.id, "Reverting...");
        const res = await revertCommit(sha);
        await sendTelegram(
          chatId,
          `Reverted ${codeInline(sha.slice(0, 7))}.\nFiles: ${res.revertedFiles.map((f) => codeInline(f)).join(", ")}`
        );
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("trycode:")) {
        const id = data.slice("trycode:".length).trim();
        const pending = pendingGet(id);
        if (!pending || !pending.tryCodeInstruction) {
          await answerCallback(cb.id, "Expired. Please resend your request.");
          await sendTelegram(chatId, "⏱️ That prompt expired. Please resend your request.");
          return NextResponse.json({ ok: true });
        }

        await answerCallback(cb.id, "Generating code preview...");
        pendingStore.delete(id);
        await handleCodeRequest(chatId, pending.fromId, pending.tryCodeInstruction);
        return NextResponse.json({ ok: true });
      }

      await answerCallback(cb.id, "Unknown action");
      return NextResponse.json({ ok: true });
    }

    // Messages (text, captions, photos, voice)
    const message = update.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id as number;
    const fromId = message.from?.id as number;
    const chatType = message.chat?.type as string | undefined;

    const adminConfigured = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean).length > 0;

    if (!isAdmin(fromId)) {
      // Helpful error in private chat so you can configure the correct ID in Vercel env vars.
      if (chatType === "private") {
        const reason = adminConfigured
          ? "Not authorized."
          : "Admin IDs not configured on the server.";
        await sendTelegram(
          chatId,
          [
            reason,
            "",
            `Your Telegram user id: <code>${String(fromId)}</code>`,
            "Set <code>TELEGRAM_ADMIN_IDS</code> in Vercel to include this id (comma-separated).",
          ].join("\n")
        );
      }
      return NextResponse.json({ ok: true });
    }

    const text = String(message.text || message.caption || "").trim();
    const normalizedText = normalizeSlashCommandText(text);

    const photos = (Array.isArray(message.photo) ? message.photo : []) as TelegramPhotoSize[];
    const voice = (message.voice || message.audio) as TelegramAudioLike | undefined;

    if (!text && photos.length === 0 && !voice) {
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === "/start") {
      await handleStart(chatId);
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/help") {
      await handleHelp(chatId);
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/helper") {
      await handleHelper(chatId);
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/code" || normalizedText.startsWith("/code ")) {
      const rest = normalizedText.slice("/code".length).trimStart();
      if (!rest || rest.toLowerCase() === "help") {
        await handleCodeHelp(chatId);
        return NextResponse.json({ ok: true });
      }
      await handleCodeRequest(chatId, fromId, rest);
      return NextResponse.json({ ok: true });
    }
    if (normalizedText.startsWith("/event")) {
      await handleEventCommand(chatId, fromId, normalizedText);
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/tree" || normalizedText === "/tree help") {
      await handleTreeHelp(chatId);
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/tree pending") {
      await handleTreeList(chatId, "pending");
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/tree live" || normalizedText === "/tree approved") {
      await handleTreeList(chatId, "approved");
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/tree rejected") {
      await handleTreeList(chatId, "rejected");
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/status") {
      await handleStatus(chatId);
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/deploy") {
      await handleStatus(chatId);
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/undo" || normalizedText === "/revert") {
      await handleUndo(chatId);
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/sections") {
      await handleSections(chatId);
      return NextResponse.json({ ok: true });
    }
    if (normalizedText === "/reset") {
      pendingClearChat(chatId);
      await sendTelegram(chatId, "✅ Cleared pending previews.");
      return NextResponse.json({ ok: true });
    }

    const deterministic = normalizedText ? parseDeterministicCommand(normalizedText) : null;
    const heuristic = normalizedText ? parseHeuristicActions(normalizedText) : null;

    // Media hint: users can send a photo and say "use this as hero image" etc.
    const wantsUpload =
      photos.length > 0 &&
      !!text &&
      /(use this|use this photo|use this image|set as hero|make.*hero|add to gallery|upload)/i.test(text);

    // Event draft: if a draft exists, photos can be attached without any caption.
    const draft = eventDraftGet(chatId);
    const captionLooksLikeEventPhoto = !text || /(event|draft|for the event|for this event)/i.test(text);
    if (photos.length > 0 && draft && captionLooksLikeEventPhoto && !wantsUpload) {
      await sendChatAction(chatId, "upload_photo");
      const best = pickLargestPhoto(photos);
      const captionForUpload = text ? `event:${draft.title} | ${text}` : `event:${draft.title}`;
      const uploadRes = await uploadTelegramMediaToGitHub({
        fileId: best.file_id,
        caption: captionForUpload,
        chatId,
        fromId,
      });

      const nextDraft: EventDraft = {
        ...draft,
        createdAt: Date.now(), // bump TTL on activity
        gallery: [
          ...draft.gallery,
          {
            src: uploadRes.publicPath,
            alt: text ? truncate(text, 90) : `${draft.title} photo`,
          },
        ],
        event: {
          ...draft.event,
          image: draft.event.image || uploadRes.publicPath,
          image_alt: draft.event.image_alt || (text ? truncate(text, 90) : `${draft.title} photo`),
        },
      };
      eventDraftSet(nextDraft);

      await sendTelegram(
        chatId,
        [
          "📷 <b>Added photo to event draft</b>",
          `Event: <b>${escapeHtml(nextDraft.title)}</b>`,
          `Total photos: <b>${String(nextDraft.gallery.length)}</b>`,
          "",
          `Next: ${codeInline("/event publish")} (or send more photos)`,
        ].join("\n"),
        [[
          { text: "📋 Draft Status", callback_data: "event:status" },
          { text: "✅ Publish", callback_data: "event:publish" },
        ]]
      );
      return NextResponse.json({ ok: true });
    }

    // If we want to upload, do it first and inject the resulting path into the prompt.
    let uploadedPath: string | null = null;
    let forcedActions: CMSAction[] | null = null;
    if (wantsUpload) {
      await sendChatAction(chatId, "upload_photo");
      const best = pickLargestPhoto(photos);
      const uploadRes = await uploadTelegramMediaToGitHub({ fileId: best.file_id, caption: text, chatId, fromId });
      uploadedPath = uploadRes.publicPath;
      await sendTelegram(
        chatId,
        [
          "<b>Uploaded</b> media to the repo.",
          `Path: <code>${uploadedPath}</code>`,
          `SHA: <code>${uploadRes.commitSha.slice(0, 7)}</code>`,
          uploadRes.commitUrl ? `Commit: ${uploadRes.commitUrl}` : "",
        ].filter(Boolean).join("\n")
      );

      // Deterministic "magic" for event galleries: if user says "add this to gallery in <event> in events"
      // we can handle it without AI guessing the slug.
      if (uploadedPath && /(gallery)/i.test(text) && /(event|events)/i.test(text)) {
        const hint = extractEventHintFromGalleryRequest(text);
        if (hint) {
          forcedActions = [
            {
              action: "add_event_gallery_image",
              slug: hint,
              src: uploadedPath,
              alt: `${hint} photo`,
            },
          ];
        }
      }
    }

    let actions: CMSAction[] = [];
    if (forcedActions) {
      actions = forcedActions;
    } else if (deterministic) {
      actions = deterministic;
    } else if (heuristic) {
      actions = heuristic;
    } else if (voice) {
      await sendChatAction(chatId, "typing");
      const { file_path, bytes } = await getTelegramFileBytes(String(voice.file_id));
      const audioBase64 = Buffer.from(new Uint8Array(bytes)).toString("base64");
      const audioFormat = normalizeAudioFormat(extFromPath(file_path) || "ogg");
      actions = await parseCommandWithMedia({
        text: uploadedPath ? `${text}\n\nUploaded media path you may reference: ${uploadedPath}` : (text || "Voice note"),
        audioBase64,
        audioFormat,
      });
    } else if (photos.length > 0) {
      if (!text) {
        await sendTelegram(chatId, "Send a caption with your screenshot/photo describing what to change.");
        return NextResponse.json({ ok: true });
      }

      await sendChatAction(chatId, "typing");
      const best = pickPhotoForVision(photos);
      const { file_path, bytes } = await getTelegramFileBytes(String(best.file_id));
      const mime = guessMimeFromPath(file_path);
      const b64 = Buffer.from(new Uint8Array(bytes)).toString("base64");
      const imageDataUrl = `data:${mime};base64,${b64}`;

      actions = await parseCommandWithMedia({
        text: uploadedPath ? `${text}\n\nUploaded media path you may reference: ${uploadedPath}` : text,
        imageDataUrl,
      });
    } else {
      actions = await parseCommand(text);
    }

    // Optional "magic mode" for safe heuristics: auto-commit without a Preview.
    // This is intentionally limited to heuristics (not AI, not /code) so it stays predictable.
    const autoCommitSimple = (process.env.TELEGRAM_AUTO_COMMIT_SIMPLE || "").toLowerCase();
    const shouldAutoCommitSimple =
      heuristic &&
      (autoCommitSimple === "1" || autoCommitSimple === "true" || autoCommitSimple === "yes");

    if (shouldAutoCommitSimple && actions.length > 0 && actions.every(isSupportedAction) && !actions.some((a) => a.action === "unknown")) {
      await sendChatAction(chatId, "typing");
      const siteUrl = process.env.SITE_URL || "https://www.holditdown.uk";
      for (const act of actions) {
        const res = await applyAction(act, { fromId, requestText: text });
        if ("error" in res) {
          await sendTelegram(chatId, `Failed: ${codeInline(res.error)}`);
          continue;
        }
        const buttons: TelegramInlineButton[][] = [[{ text: "↩️ Undo", callback_data: `undo:${res.commitSha}` }]];
        if (res.commitUrl) buttons.push([{ text: "View Commit", url: res.commitUrl }]);
        if (siteUrl) buttons.push([{ text: "View Live Site", url: siteUrl }]);
        buttons.push([{ text: "🔎 Deploy status", callback_data: `deploy:${res.commitSha}` }]);
        await sendTelegram(
          chatId,
          [
            "✅ <b>Committed</b>",
            `• ${escapeHtml(res.description)}`,
            `• SHA: ${codeInline(res.commitSha.slice(0, 7))}`,
            "",
            "⏳ Deploying... (~1–2 min)",
          ].join("\n"),
          buttons,
          { disablePreview: true }
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (actions.length === 1 && actions[0].action === "undo") {
      await handleUndo(chatId);
      return NextResponse.json({ ok: true });
    }
    if (actions.length === 1 && actions[0].action === "get_status") {
      await handleStatus(chatId);
      return NextResponse.json({ ok: true });
    }

    // Preview + confirm
    if (actions.length === 0) {
      await sendTelegram(chatId, "No changes found.");
      return NextResponse.json({ ok: true });
    }

    if (!actions.every(isSupportedAction)) {
      await sendTelegram(
        chatId,
        [
          "🤔 I couldn’t understand that request (parser returned an invalid action).",
          "",
          "Try again with a bit more detail, or use /sections.",
        ].join("\n")
      );
      return NextResponse.json({ ok: true });
    }

    if (actions.some((a) => a.action === "unknown")) {
      const first = actions.find((a) => a.action === "unknown") as { action: "unknown"; message: string } | undefined;
      const previewId = crypto.randomUUID().slice(0, 12);
      pendingStore.set(previewId, {
        id: previewId,
        chatId,
        fromId,
        createdAt: Date.now(),
        actions: [],
        sourceText: text,
        tryCodeInstruction: text,
      });

      await sendTelegram(
        chatId,
        [
          "🤔 I’m not sure what to change.",
          first?.message ? `\n${escapeHtml(first.message)}` : "",
          "",
          `Try ${codeInline("/sections")} or send a screenshot + caption.`,
          "",
          `If this is a layout/style/code change, tap “Try Code Edit” (no code will be shown).`,
        ].join("\n"),
        [[
          { text: "🧩 Try Code Edit", callback_data: `trycode:${previewId}` },
          { text: "❌ Cancel", callback_data: `cancel:${previewId}` },
        ]]
      );
      return NextResponse.json({ ok: true });
    }

    await sendChatAction(chatId, "typing");

    const previewId = crypto.randomUUID().slice(0, 12);
    pendingStore.set(previewId, {
      id: previewId,
      chatId,
      fromId,
      createdAt: Date.now(),
      actions,
      sourceText: text,
    });

    const previewMsg = [
      "📝 <b>Preview</b>",
      "",
      actions.map(summarizeAction).join("\n"),
      "",
      "<b>Ready to commit?</b>",
    ].join("\n");

    await sendTelegram(
      chatId,
      previewMsg,
      [
        [
          { text: "✅ Yes, Commit", callback_data: `commit:${previewId}` },
          { text: "❌ No, Cancel", callback_data: `cancel:${previewId}` },
        ],
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Telegram webhook error:", msg);
    // Always return 200 to Telegram to avoid repeated retries piling up.
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}
