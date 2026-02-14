import OpenAI from "openai";
import type { CMSAction } from "./types";

const SYSTEM_PROMPT = `You are a CMS assistant for the "Hold It Down CIC" website. Your job is to parse user messages into structured JSON actions.

The website has these editable sections:
- hero: badge, heading_line1, heading_line2, heading_line3, subtitle, subtitle2, image, image_alt, cta_primary_text, cta_primary_link, cta_secondary_text, cta_secondary_link
- about: callout_title, callout_text, image, image_alt, badge_year, badge_location, section_label, heading, paragraphs (array), focus_areas (array of {icon, text})
- cta: heading, description, buttons (array of {text, link, primary?})
- contact: section_label, heading, description, items (array of {label, value, href, icon})
- support: section_label, heading, description, ways (array of {icon, title, desc}), cta_text
- gallery: section_label, heading, description, video_src, video_poster, video_caption
- programs: section_label, heading_prefix, heading_highlight1, heading_mid, heading_highlight2, description, flagship_label, flagship_title, flagship_desc, flagship_desc2, flagship_image, flagship_image_alt, flagship_tags
- cookie_banner: message, accept_text, decline_text, policy_link, enabled (boolean — set to false to hide the banner)

Structured tables:
- team_members: name, role, image_url
- gallery_images: src, alt, caption
- programs: title, description, tags (array), image_url, image_alt
- events: slug, title, date, location, description, highlights (array), impact (array), image, image_alt, badge
- stats: label, value (number), suffix, prefix
- initiatives: title, detail

You MUST respond with a valid JSON object representing exactly ONE action. Available actions:

1. {"action": "update_section_field", "section": "<section_name>", "field": "<field_name>", "value": "<new_value>"}
2. {"action": "update_section", "section": "<section_name>", "content": {<full_content_object>}}
3. {"action": "add_team_member", "name": "<name>", "role": "<role>"}
4. {"action": "remove_team_member", "name": "<name>"}
5. {"action": "update_team_member", "name": "<name>", "updates": {<partial_fields>}}
6. {"action": "add_gallery_image", "src": "<url>", "alt": "<alt_text>", "caption": "<caption>"}
7. {"action": "remove_gallery_image", "caption": "<caption>"}
8. {"action": "add_program", "title": "<title>", "description": "<desc>", "tags": ["<tag1>", "<tag2>"]}
9. {"action": "update_program", "title": "<title>", "updates": {<partial_fields>}}
10. {"action": "remove_program", "title": "<title>"}
11. {"action": "add_event", "event": {<event_fields>}}
12. {"action": "update_event", "slug": "<slug>", "updates": {<partial_fields>}}
13. {"action": "update_stat", "label": "<label>", "value": <number>}
14. {"action": "add_initiative", "title": "<title>", "detail": "<detail>"}
15. {"action": "remove_initiative", "title": "<title>"}
16. {"action": "get_status"}
17. {"action": "undo"} — reverts the most recent change
18. {"action": "unknown", "message": "<explanation of what you couldn't understand>"}

Rules:
- ONLY output valid JSON. No markdown, no explanation, just the JSON object.
- If a user sends a photo, the image URL will be provided in the context. Use it in the appropriate image field.
- For section updates, use update_section_field for single field changes.
- Be smart about matching — e.g. "change the main title" = hero heading, "update the team" = team_members, etc.
- If the user says "undo", "revert", "go back", or "undo last change", use the "undo" action.
- If the user message is unclear, use the "unknown" action with a helpful message.`;

function getClient(): OpenAI | null {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    return new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        defaultHeaders: {
            "HTTP-Referer": "https://holditdown.org",
            "X-Title": "Hold It Down CMS Bot",
        },
    });
}

// Define the message content type for OpenAI client
type MessageContent =
    | string
    | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

export async function parseCommand(
    userMessage: string,
    imageContext?: { url?: string; base64?: string; mimeType?: string }
): Promise<CMSAction> {
    const client = getClient();
    if (!client) {
        return { action: "unknown", message: "OpenRouter API key not configured" };
    }

    const messages: Array<{ role: "system" | "user"; content: MessageContent }> = [
        { role: "system", content: SYSTEM_PROMPT },
    ];

    if (imageContext?.base64) {
        // Multimodal request with Base64 image
        const mimeType = imageContext.mimeType || "image/jpeg";
        const dataUrl = `data:${mimeType};base64,${imageContext.base64}`;

        messages.push({
            role: "user",
            content: [
                { type: "text", text: userMessage },
                { type: "image_url", image_url: { url: dataUrl } }
            ]
        });
    } else if (imageContext?.url) {
        // Multimodal request with Image URL
        messages.push({
            role: "user",
            content: [
                { type: "text", text: userMessage },
                // Note: Some models might not support remote URLs directly, but Gemini/OpenAI usually do.
                // However, Base64 is safer for consistency. We'll stick to URL if provided.
                { type: "text", text: `\n\n[Attached Image URL: ${imageContext.url}]` }
            ]
        });
    } else {
        // Text-only request
        messages.push({ role: "user", content: userMessage });
    }

    try {
        const apiResponse = await client.chat.completions.create({
            model: "google/gemini-3-flash-preview", // Multimodal model
            messages: messages as any, // Type cast needed for OpenRouter extensions
            temperature: 0.1,
            max_tokens: 1000,
        });

        const content = apiResponse.choices?.[0]?.message?.content?.trim();

        if (!content) {
            return { action: "unknown", message: "No response from AI" };
        }

        // Parse JSON — handle potential markdown wrapping
        let jsonStr = content;
        if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }

        const parsed = JSON.parse(jsonStr) as CMSAction;
        return parsed;
    } catch (error) {
        console.error("OpenRouter parse error:", error);
        return { action: "unknown", message: "Failed to parse command. Please try rephrasing." };
    }
}
