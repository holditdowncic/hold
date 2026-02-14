import { NextRequest, NextResponse } from "next/server";
import type { CMSAction, EventData, GalleryImage, Initiative, Program, Stat, TeamMember } from "@/lib/types";
import { parseCommand } from "@/lib/openrouter";
import { getGitHubFile, putGitHubFile, listRecentCommits, revertCommit } from "@/lib/github";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

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

async function sendTelegram(chatId: number, text: string, buttons?: { text: string; callback_data: string }[][]) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
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
    "<b>Website Editor Bot</b>",
    "",
    "Send a message like:",
    "- “Change the hero subtitle to …”",
    "- “Update contact email to …”",
    "- “Add a team member Jane Doe as Programme Lead”",
    "",
    "Commands:",
    "- /status",
    "- /undo",
    "",
    "Notes:",
    "- Changes commit to GitHub. If Vercel is connected to the repo, it auto-deploys from the commit.",
    "- You will get an <b>Undo</b> button after each change.",
  ].join("\n");
  await sendTelegram(chatId, msg);
}

async function handleStatus(chatId: number) {
  const commits = await listRecentCommits(10);
  const last = commits.find((c) => c.commit.message.startsWith("telegram:"));
  const msg = [
    "<b>Status</b>",
    `GitHub branch edits: <code>${process.env.GITHUB_OWNER || "holditdowncic"}/${process.env.GITHUB_REPO || "hold"}:${process.env.GITHUB_BRANCH || "main"}</code>`,
    last ? `Last Telegram commit: <code>${last.sha.slice(0, 7)}</code>` : "Last Telegram commit: (none found)",
    "",
    "Vercel: should auto-deploy when GitHub receives the commit (if the project is linked).",
  ].join("\n");
  await sendTelegram(chatId, msg);
}

async function handleUndo(chatId: number) {
  const commits = await listRecentCommits(20);
  const last = commits.find((c) => c.commit.message.startsWith("telegram:") && !c.commit.message.startsWith("telegram: revert"));
  if (!last) {
    await sendTelegram(chatId, "No recent Telegram commit found to undo.");
    return;
  }
  const res = await revertCommit(last.sha);
  await sendTelegram(
    chatId,
    `Reverted <code>${last.sha.slice(0, 7)}</code>.\nFiles: ${res.revertedFiles.map((f) => `<code>${f}</code>`).join(", ")}`
  );
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

      if (data.startsWith("undo:")) {
        const sha = data.slice("undo:".length).trim();
        await answerCallback(cb.id, "Reverting...");
        const res = await revertCommit(sha);
        await sendTelegram(
          chatId,
          `Reverted <code>${sha.slice(0, 7)}</code>.\nFiles: ${res.revertedFiles.map((f) => `<code>${f}</code>`).join(", ")}`
        );
        return NextResponse.json({ ok: true });
      }

      await answerCallback(cb.id, "Unknown action");
      return NextResponse.json({ ok: true });
    }

    // Text messages
    const message = update.message;
    if (!message?.text) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id as number;
    const fromId = message.from?.id as number;

    if (!isAdmin(fromId)) {
      return NextResponse.json({ ok: true });
    }

    const text = String(message.text || "").trim();

    if (text === "/help" || text === "/start") {
      await handleHelp(chatId);
      return NextResponse.json({ ok: true });
    }
    if (text === "/status") {
      await handleStatus(chatId);
      return NextResponse.json({ ok: true });
    }
    if (text === "/undo") {
      await handleUndo(chatId);
      return NextResponse.json({ ok: true });
    }

    const deterministic = parseDeterministicCommand(text);
    const actions = deterministic ?? await parseCommand(text);
    if (actions.length === 1 && actions[0].action === "undo") {
      await handleUndo(chatId);
      return NextResponse.json({ ok: true });
    }
    if (actions.length === 1 && actions[0].action === "get_status") {
      await handleStatus(chatId);
      return NextResponse.json({ ok: true });
    }

    const results: Array<{ description: string; commitSha: string; commitUrl?: string }> = [];
    for (const act of actions) {
      if (act.action === "unknown") {
        await sendTelegram(chatId, `Could not parse: ${(act as { message: string }).message}`);
        continue;
      }
      const res = await applyAction(act);
      if ("error" in res) {
        await sendTelegram(chatId, `Failed: ${res.error}`);
        continue;
      }
      results.push(res);

      await sendTelegram(
        chatId,
        [
          `<b>Committed</b>: ${res.description}`,
          `SHA: <code>${res.commitSha.slice(0, 7)}</code>`,
          res.commitUrl ? `Commit: ${res.commitUrl}` : "",
          "",
          "Vercel will deploy after GitHub receives the commit (if linked).",
        ].filter(Boolean).join("\n"),
        [[{ text: "↩️ Undo", callback_data: `undo:${res.commitSha}` }]]
      );
    }

    if (results.length === 0 && actions.length > 0) {
      await sendTelegram(chatId, "No changes applied.");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Telegram webhook error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
