import type { CMSAction } from "@/lib/types";

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "input_audio"; input_audio: { data: string; format: string } };

function coerceActions(raw: unknown): CMSAction[] {
  if (!Array.isArray(raw)) {
    return [{ action: "unknown", message: "Parser returned invalid actions. Try again." }];
  }

  const out: CMSAction[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      out.push({ action: "unknown", message: "Parser returned an invalid action. Try again." });
      continue;
    }

    const obj = item as Record<string, unknown>;
    const a = obj["action"];
    if (typeof a === "string") {
      out.push(obj as unknown as CMSAction);
      continue;
    }

    // Common model mistake: forgets `action` and returns just `{ event: {...} }`.
    if (obj["event"] && typeof obj["event"] === "object") {
      out.push({ action: "add_event", event: obj["event"] } as unknown as CMSAction);
      continue;
    }

    out.push({ action: "unknown", message: "Parser returned an invalid action shape. Try again." });
  }

  // If any unknown appears, surface it as the single response (reduces accidental commits).
  const firstUnknown = out.find((x) => x.action === "unknown") as { action: "unknown"; message: string } | undefined;
  if (firstUnknown) return [firstUnknown];
  return out;
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  // Naive but effective for typical "JSON only" responses.
  for (let end = text.length - 1; end > start; end--) {
    if (text[end] === "}") {
      const candidate = text.slice(start, end + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // keep scanning
      }
    }
  }
  return null;
}

function systemPrompt(): string {
  return [
    "You are a command parser for a Telegram bot that edits a website by changing JSON files in a GitHub repo.",
    "Return ONLY valid JSON.",
    "Output shape: {\"actions\": CMSAction[]}.",
    "Each action must include an `action` field with the exact action name.",
    "If an audio input is provided, first transcribe it and treat the transcription as the user message.",
    "CMSAction is one of:",
    "- update_section_field {section, field, value} updates src/data/sections.json section object field",
    "- update_section {section, content} replaces the section object",
    "- add_custom_section {section} adds an item to src/data/sections.json custom_sections[]",
    "- update_custom_section {id, updates} updates an item in custom_sections[] by id",
    "- remove_custom_section {id} removes an item from custom_sections[] by id",
    "- reorder_custom_sections {ids} reorders custom_sections[] by id list",
    "- add_team_member {name, role, image_url?} edits src/data/team.json",
    "- update_team_member {name, updates} edits src/data/team.json",
    "- remove_team_member {name} edits src/data/team.json",
    "- add_program {title, description, tags, image_url?, image_alt?} edits src/data/programs.json",
    "- update_program {title, updates} edits src/data/programs.json",
    "- remove_program {title} edits src/data/programs.json",
    "- add_initiative {title, detail} edits src/data/initiatives.json",
    "- remove_initiative {title} edits src/data/initiatives.json",
    "- add_gallery_image {src, alt, caption} edits src/data/gallery.json",
    "- remove_gallery_image {caption} edits src/data/gallery.json",
    "- add_event {event} edits src/data/events.json (event may include title, date, location, description, highlights, impact, image, image_alt, badge, gallery)",
    "- update_event {slug, updates} edits src/data/events.json",
    "- update_stat {label, value, suffix?, prefix?} edits src/data/stats.json",
    "- undo (user asked to revert the last change)",
    "- get_status",
    "- unknown {message}",
    "Allowed section keys: hero, about, mission, programs, gallery, cta, support, contact, cookie_banner.",
    "If the user provides an image (screenshot/photo), use it to understand what on-screen text/section they mean and what to change.",
    "If the user says 'add a new section', prefer add_custom_section instead of trying to overload existing sections.",
    "If the user request is ambiguous or unsafe, return unknown with a brief message asking for clarification.",
  ].join("\n");
}

async function parseWithUserContent(userContent: string | ContentPart[]): Promise<CMSAction[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return [{ action: "unknown", message: "OPENROUTER_API_KEY not configured. Use /set commands instead." }];
  }

  const model = process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview";

  const system = systemPrompt();

  const payloadBase = {
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
  };

  async function call(payload: unknown) {
    try {
      return await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown network error";
      return new Response(JSON.stringify({ error: msg }), { status: 599 });
    }
  }

  // Some models reject response_format; try with it first, then retry without.
  let res = await call({ ...payloadBase, response_format: { type: "json_object" } });
  if (!res.ok) {
    const bodyText = await res.text();
    res = await call(payloadBase);
    if (!res.ok) {
      return [{ action: "unknown", message: `OpenRouter error (${res.status}): ${bodyText}` }];
    }
  }

  const data = (await res.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content || "";
  const jsonText = extractFirstJsonObject(content);
  if (!jsonText) {
    return [{ action: "unknown", message: "OpenRouter returned non-JSON output. Try again with a simpler message." }];
  }

  try {
    const parsed = JSON.parse(jsonText) as { actions?: CMSAction[] };
    if (!parsed.actions || !Array.isArray(parsed.actions)) {
      return [{ action: "unknown", message: "Parser returned invalid JSON shape. Try again." }];
    }
    return coerceActions(parsed.actions);
  } catch {
    return [{ action: "unknown", message: "Failed to parse OpenRouter response JSON. Try again." }];
  }
}

export async function parseCommand(text: string): Promise<CMSAction[]> {
  const user = ["User message:", text].join("\n");
  return parseWithUserContent(user);
}

export async function parseCommandWithMedia(args: {
  text: string;
  imageDataUrl?: string;
  audioBase64?: string;
  audioFormat?: string;
}): Promise<CMSAction[]> {
  const parts: ContentPart[] = [{ type: "text", text: ["User message:", args.text].join("\n") }];

  if (args.imageDataUrl) {
    parts.push({ type: "image_url", image_url: { url: args.imageDataUrl } });
  }

  if (args.audioBase64) {
    parts.push({
      type: "input_audio",
      input_audio: { data: args.audioBase64, format: args.audioFormat || "ogg" },
    });
  }

  return parseWithUserContent(parts);
}
