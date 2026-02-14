import type { CMSAction } from "@/lib/types";

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

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

export async function parseCommand(text: string): Promise<CMSAction[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return [{ action: "unknown", message: "OPENROUTER_API_KEY not configured. Use /set commands instead." }];
  }

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  const system = [
    "You are a command parser for a Telegram bot that edits a website by changing JSON files in a GitHub repo.",
    "Return ONLY valid JSON.",
    "Output shape: {\"actions\": CMSAction[]}.",
    "CMSAction is one of:",
    "- update_section_field {section, field, value} updates src/data/sections.json section object field",
    "- update_section {section, content} replaces the section object",
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
    "Allowed section keys: hero, about, programs, gallery, cta, support, contact, cookie_banner.",
    "If the user request is ambiguous or unsafe, return unknown with a brief message asking for clarification.",
  ].join("\n");

  const user = [
    "User message:",
    text,
  ].join("\n");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      // Many OpenRouter models support this OpenAI-style hint.
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    return [{ action: "unknown", message: `OpenRouter error (${res.status}): ${bodyText}` }];
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
    return parsed.actions;
  } catch {
    return [{ action: "unknown", message: "Failed to parse OpenRouter response JSON. Try again." }];
  }
}

