import { NextRequest, NextResponse } from "next/server";
import type { CMSAction, CustomSection, EventData, GalleryImage, Initiative, Program, Stat, TeamMember } from "@/lib/types";
import { parseCommand, parseCommandWithMedia } from "@/lib/openrouter";
import {
  getGitHubFile,
  getCommitStatus,
  listRecentCommits,
  putGitHubBinaryFile,
  putGitHubFile,
  revertCommit,
} from "@/lib/github";

// This route uses Node-only APIs (Buffer). Force Node runtime on Vercel.
export const runtime = "nodejs";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const TELEGRAM_FILE_API = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}`;

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

async function updateJsonFile<T>(path: string, mutate: (data: T) => { data: T; description: string }) {
  const current = await getGitHubFile(path);
  const parsed = JSON.parse(current.text) as T;
  const { data, description } = mutate(parsed);
  const res = await putGitHubFile({
    path,
    sha: current.sha,
    text: jsonPretty(data),
    message: `telegram: ${description}`,
  });
  return { description, ...res };
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

type PendingChange = {
  id: string;
  chatId: number;
  fromId: number;
  createdAt: number;
  actions: CMSAction[];
  sourceText: string;
};

declare global {
  var __holdTelegramPending: Map<string, PendingChange> | undefined;
}

const pendingStore: Map<string, PendingChange> =
  globalThis.__holdTelegramPending ?? (globalThis.__holdTelegramPending = new Map());

const PENDING_TTL_MS = 10 * 60 * 1000;

function pendingCleanup() {
  const now = Date.now();
  for (const [id, p] of pendingStore.entries()) {
    if (now - p.createdAt > PENDING_TTL_MS) pendingStore.delete(id);
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
}): Promise<{ publicPath: string; commitSha: string; commitUrl?: string }> {
  const { file_path, bytes } = await getTelegramFileBytes(args.fileId);
  const ext = extFromPath(file_path) || "bin";
  const slug = slugify(args.caption || "upload") || String(Date.now());
  const ts = new Date().toISOString().slice(0, 10);
  const repoPath = `public/media/telegram/${ts}-${slug}.${ext}`;

  const base64 = Buffer.from(new Uint8Array(bytes)).toString("base64");
  const res = await putGitHubBinaryFile({
    path: repoPath,
    base64,
    message: `telegram: upload media (${repoPath})`,
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
    case "update_stat":
      return `• Update stat: <b>${escapeHtml(act.label)}</b> = ${codeInline(String(act.value))}`;
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

async function applyAction(action: CMSAction): Promise<{ description: string; commitSha: string; commitUrl?: string } | { error: string }> {
  try {
    switch (action.action) {
      case "update_section_field": {
        const { section, field, value } = action;
        return await updateJsonFile<Record<string, unknown>>("src/data/sections.json", (data) => {
          const obj = (data[section] as Record<string, unknown>) || {};
          data[section] = { ...obj, [field]: value };
          return { data, description: `set ${section}.${field}` };
        });
      }
      case "update_section": {
        const { section, content } = action;
        return await updateJsonFile<Record<string, unknown>>("src/data/sections.json", (data) => {
          data[section] = content;
          return { data, description: `replace section ${section}` };
        });
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
        });
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
        });
      }

      case "remove_custom_section": {
        const { id } = action;
        return await updateJsonFile<Record<string, unknown>>("src/data/sections.json", (data) => {
          const raw = data["custom_sections"];
          const arr = (Array.isArray(raw) ? raw : []) as CustomSection[];
          data["custom_sections"] = arr.filter((s) => s.id !== id);
          return { data, description: `custom: remove ${id}` };
        });
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
        });
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
        });
      }
      case "update_team_member": {
        const { name, updates } = action;
        return await updateJsonFile<TeamMember[]>("src/data/team.json", (data) => {
          const idx = data.findIndex((m) => normalize(m.name) === normalize(name));
          if (idx === -1) return { data, description: `team: '${name}' not found (no-op)` };
          const next = [...data];
          next[idx] = { ...next[idx], ...updates };
          return { data: next, description: `team: update ${name}` };
        });
      }
      case "remove_team_member": {
        const { name } = action;
        return await updateJsonFile<TeamMember[]>("src/data/team.json", (data) => {
          const next = data.filter((m) => normalize(m.name) !== normalize(name));
          return { data: next, description: `team: remove ${name}` };
        });
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
        });
      }
      case "update_program": {
        const { title, updates } = action;
        return await updateJsonFile<Program[]>("src/data/programs.json", (data) => {
          const idx = data.findIndex((p) => normalize(p.title) === normalize(title));
          if (idx === -1) return { data, description: `programs: '${title}' not found (no-op)` };
          const next = [...data];
          next[idx] = { ...next[idx], ...updates };
          return { data: next, description: `programs: update ${title}` };
        });
      }
      case "remove_program": {
        const { title } = action;
        return await updateJsonFile<Program[]>("src/data/programs.json", (data) => {
          const next = data.filter((p) => normalize(p.title) !== normalize(title));
          return { data: next, description: `programs: remove ${title}` };
        });
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
        });
      }
      case "remove_initiative": {
        const { title } = action;
        return await updateJsonFile<Initiative[]>("src/data/initiatives.json", (data) => {
          const next = data.filter((i) => normalize(i.title) !== normalize(title));
          return { data: next, description: `initiatives: remove ${title}` };
        });
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
        });
      }
      case "remove_gallery_image": {
        const { caption } = action;
        return await updateJsonFile<GalleryImage[]>("src/data/gallery.json", (data) => {
          const next = data.filter((g) => normalize(g.caption) !== normalize(caption));
          return { data: next, description: `gallery: remove '${caption}'` };
        });
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
        });
      }
      case "update_event": {
        const { slug, updates } = action;
        return await updateJsonFile<EventData[]>("src/data/events.json", (data) => {
          const idx = data.findIndex((e) => e.slug === slug);
          if (idx === -1) return { data, description: `events: '${slug}' not found (no-op)` };
          const next = [...data];
          next[idx] = { ...next[idx], ...updates } as EventData;
          return { data: next, description: `events: update ${slug}` };
        });
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
        });
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
    "<b>Commands</b>",
    `• ${codeInline("/sections")} list editable sections`,
    `• ${codeInline("/status")} recent Telegram commit`,
    `• ${codeInline("/undo")} undo last Telegram change`,
    `• ${codeInline("/revert")} same as /undo`,
    `• ${codeInline("/reset")} clear pending preview`,
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

async function handleStatus(chatId: number) {
  try {
    const commits = await listRecentCommits(10);
    const last = commits.find((c) => c.commit.message.startsWith("telegram:"));
    let deployLine = "";
    let deployUrl: string | null = null;
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
    const msg = [
      "<b>Status</b>",
      `GitHub branch edits: <code>${process.env.GITHUB_OWNER || "holditdowncic"}/${process.env.GITHUB_REPO || "hold"}:${process.env.GITHUB_BRANCH || "main"}</code>`,
      last ? `Last Telegram commit: <code>${last.sha.slice(0, 7)}</code>` : "Last Telegram commit: (none found)",
      deployLine,
      "",
      "Vercel: should auto-deploy when GitHub receives the commit (if the project is linked).",
    ].join("\n");
    const buttons: TelegramInlineButton[][] = [];
    if (last) buttons.push([{ text: "🔎 Deploy status", callback_data: `deploy:${last.sha}` }]);
    if (deployUrl) buttons.push([{ text: "View Deploy", url: deployUrl }]);
    const siteUrl = process.env.SITE_URL || "https://www.holditdown.uk";
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

        for (const act of pending.actions) {
          if (act.action === "unknown") {
            await sendTelegram(chatId, `Could not parse: ${escapeHtml((act as { message: string }).message)}`);
            continue;
          }
          const res = await applyAction(act);
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

    const photos = (Array.isArray(message.photo) ? message.photo : []) as TelegramPhotoSize[];
    const voice = (message.voice || message.audio) as TelegramAudioLike | undefined;

    if (!text && photos.length === 0 && !voice) {
      return NextResponse.json({ ok: true });
    }

    if (text === "/help" || text === "/start") {
      await handleHelp(chatId);
      return NextResponse.json({ ok: true });
    }
    if (text === "/status") {
      await handleStatus(chatId);
      return NextResponse.json({ ok: true });
    }
    if (text === "/deploy") {
      await handleStatus(chatId);
      return NextResponse.json({ ok: true });
    }
    if (text === "/undo" || text === "/revert") {
      await handleUndo(chatId);
      return NextResponse.json({ ok: true });
    }
    if (text === "/sections") {
      await handleSections(chatId);
      return NextResponse.json({ ok: true });
    }
    if (text === "/reset") {
      pendingClearChat(chatId);
      await sendTelegram(chatId, "✅ Cleared pending previews.");
      return NextResponse.json({ ok: true });
    }

    const deterministic = text ? parseDeterministicCommand(text) : null;

    // Media hint: users can send a photo and say "use this as hero image" etc.
    const wantsUpload =
      photos.length > 0 &&
      !!text &&
      /(use this|use this photo|use this image|set as hero|make.*hero|add to gallery|upload)/i.test(text);

    // If we want to upload, do it first and inject the resulting path into the prompt.
    let uploadedPath: string | null = null;
    if (wantsUpload) {
      await sendChatAction(chatId, "upload_photo");
      const best = pickLargestPhoto(photos);
      const uploadRes = await uploadTelegramMediaToGitHub({ fileId: best.file_id, caption: text, chatId });
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
    }

    let actions: CMSAction[] = [];
    if (deterministic) {
      actions = deterministic;
    } else if (voice) {
      await sendChatAction(chatId, "typing");
      const { file_path, bytes } = await getTelegramFileBytes(String(voice.file_id));
      const audioBase64 = Buffer.from(new Uint8Array(bytes)).toString("base64");
      const audioFormat = extFromPath(file_path) || "ogg";
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
      const best = pickLargestPhoto(photos);
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

    if (actions.some((a) => a.action === "unknown")) {
      const first = actions.find((a) => a.action === "unknown") as { action: "unknown"; message: string } | undefined;
      await sendTelegram(
        chatId,
        [
          "🤔 I’m not sure what to change.",
          first?.message ? `\n${escapeHtml(first.message)}` : "",
          "",
          `Try ${codeInline("/sections")} or send a screenshot + caption.`,
        ].join("\n")
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
