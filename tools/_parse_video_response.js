// Parse Video Response (OpenRouter -> strict-ish JSON)
// Outputs: { title, allScenes, fullNarration, hashtags, caption, chatId, args, ... }

const response = $input.first()?.json ?? {};

let base = {};
try {
  base = $("Parse Video Research").first().json ?? {};
} catch (e) {
  base = {};
}

let mode = String(base?.videoMode || base?.video_mode || "").toLowerCase().trim();
if (!mode) {
  try { mode = String($("Prepare Video Args").first().json?.videoMode || "").toLowerCase().trim(); } catch (e) {}
}
if (!mode) mode = "kling_multiclip";
const TARGET_SCENES = mode === "talking_head" ? 1 : 2;
const DEFAULT_SCENE_DURATION_SEC = mode === "talking_head" ? 30 : 12; // talking head is a 30s single-image style

function clean(s) {
  return String(s ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLeakText(text) {
  const t = clean(text).toLowerCase();
  if (!t) return true;
  return [
    "to complete this research task",
    "search specifically for",
    "search results provided do not contain",
    "do not contain any information",
    "return strict json",
    "topic lock",
    "output json only",
    "schema",
    "recommendation:"
  ].some((p) => t.includes(p));
}

function sanitizeNarration(text, fallback) {
  let t = clean(text);
  if (!t || isLeakText(t)) t = clean(fallback || "");
  if (!t) t = "Take one small step today and follow Dignitate for support.";
  t = t.replace(/\s*(?:https?:\/\/\S+|\[[^\]]+\])\s*/g, " ").trim();
  return t;
}


function countWords(text) {
  return clean(text).split(/\s+/).filter(Boolean).length;
}

function trimToWords(text, maxWords) {
  const words = clean(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

function estimateDurationForNarration(narration, fallbackSec) {
  const words = countWords(narration);
  if (!words) return fallbackSec;

  if (mode === "talking_head") {
    // Talking-head mode is intentionally 30s for natural pacing and fuller context.
    return 30;
  }

  const est = Math.ceil(words / 2.8) + 1;
  return Math.max(10, Math.min(14, est));
}

function getContent(r) {
  const c = r?.choices?.[0]?.message?.content;
  if (Array.isArray(c)) {
    return c
      .map((p) => clean(p?.text ?? p?.content ?? ""))
      .filter(Boolean)
      .join("\n");
  }
  return clean(c ?? "");
}

function parseJsonLoose(text) {
  const t0 = String(text ?? "").trim();
  if (!t0) return null;

  const t1 = t0
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(t1);
  } catch (e) {
    const start = t1.indexOf('{');
    const end = t1.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t1.slice(start, end + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

function normalizeScene(s, idx, fallbackNarration) {
  const rawNarration = clean(s?.narration);
  const narrationBase = sanitizeNarration(rawNarration, fallbackNarration);
  const narration = mode === "talking_head"
    ? trimToWords(narrationBase, 85)
    : trimToWords(narrationBase, 30);
  const visualPrompt = clean(s?.visualPrompt ?? s?.visual_prompt);

  const durationRaw = Number(s?.duration);
  const requestedDuration = Number.isFinite(durationRaw) && durationRaw > 0
    ? durationRaw
    : DEFAULT_SCENE_DURATION_SEC;
  const duration = estimateDurationForNarration(narration, requestedDuration);

  // Default type only if missing. We'll re-pin hook/cta positions below.
  const type = clean(s?.type) || (idx === 0 ? "hook" : "cta");

  return { type, narration, visualPrompt, duration, index: idx };
}

const content = getContent(response);
const parsed = parseJsonLoose(content) ?? {};

const title =
  clean(parsed?.title) ||
  clean(base?.args) ||
  clean(base?.requestedTopic) ||
  "Dignitate Video";

const facts = (Array.isArray(base?.researchFacts) ? base.researchFacts : [])
  .map((f) => clean(typeof f === "string" ? f : (f?.fact || "")))
  .filter(Boolean);
const actions = (Array.isArray(base?.researchActions) ? base.researchActions : [])
  .map((a) => clean(typeof a === "string" ? a : (a?.action || a?.step || "")))
  .filter(Boolean);

const fallbackHook = facts[0]
  ? `Quick question: did you know this UK update matters for your dementia-care routine? ${facts[0]}`
  : "Quick question: are you carrying most dementia care on your own this week?";

const fallbackAction = actions[0]
  ? actions[0]
  : "Ask your GP or memory service this week for one named contact and a written care plan update.";

const fallbackCta = "Follow Dignitate for support.";

const fallbackTalkingHead = trimToWords(
  `${fallbackHook} ${actions[0] || "One practical step: write one clear support request and share it today."} ${actions[1] || fallbackAction} ${fallbackCta}`,
  82
);

let scenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
scenes = scenes.map((s, i) => {
  const fallback = mode === "talking_head"
    ? fallbackTalkingHead
    : (i === 0 ? trimToWords(`${fallbackHook} ${fallbackAction}`, 30) : trimToWords(`${actions[1] || "Take one small step today and share it with your care team."} ${fallbackCta}`, 30));
  return normalizeScene(s, i, fallback);
}).filter((s) => s.narration);

// Keep it short and consistent.
if (scenes.length > TARGET_SCENES) scenes = scenes.slice(0, TARGET_SCENES);

// If too few, pad to target scene count.
const pad = (TARGET_SCENES === 1)
  ? [
      {
        type: "hook",
        narration: fallbackTalkingHead,
        visualPrompt: "Podcast studio talking head with microphone, warm lighting, UK documentary realism",
        duration: DEFAULT_SCENE_DURATION_SEC,
      },
    ]
  : [
      {
        type: "hook",
        narration: trimToWords(`${fallbackHook} ${fallbackAction}`, 30),
        visualPrompt: "UK clinic corridor, documentary realism, overcast daylight",
        duration: DEFAULT_SCENE_DURATION_SEC,
      },
      {
        type: "cta",
        narration: trimToWords(`${actions[1] || "Pick one small step today: write it down and ask for one specific help."} ${fallbackCta}`, 30),
        visualPrompt: "UK kitchen table, care plan notes and calendar, documentary realism",
        duration: DEFAULT_SCENE_DURATION_SEC,
      },
    ];

while (scenes.length < TARGET_SCENES) {
  const idx = scenes.length;
  scenes.push(normalizeScene(pad[idx], idx, pad[idx]?.narration || ""));
}

// Enforce structure positions regardless of model output.
scenes = scenes.map((s, idx) => {
  const forcedType = (TARGET_SCENES === 1) ? "hook" : (idx === 0 ? "hook" : "cta");
  return {
    ...s,
    type: forcedType,
    index: idx,
  };
});

const fullNarration = clean(scenes.map((s) => s.narration).join(' '));

let hashtags = Array.isArray(parsed?.hashtags) ? parsed.hashtags : [];
hashtags = hashtags.map((h) => clean(h)).filter(Boolean);
if (!hashtags.length) hashtags = ["#DementiaCare", "#CarerSupport", "#UKHealth", "#Dignitate"];

let caption = clean(parsed?.caption);
if (!caption) caption = `${title}. Follow Dignitate for support.`;
if (isLeakText(caption)) caption = `${title}. ${actions[0] || "Take one practical step this week."} Follow Dignitate for support.`;

return [
  {
    json: {
      ...base,
      title,
      allScenes: scenes,
      scenes,
      fullNarration,
      hashtags,
      caption,
      videoMode: mode || clean(base?.videoMode || base?.video_mode || "kling_multiclip"),
      chatId: String(base?.chatId ?? base?.chatKey ?? base?.memoryKey ?? ''),
      args: clean(base?.args ?? base?.requestedTopic ?? title),
      _debug: {
        resolvedVideoMode: mode || clean(base?.videoMode || base?.video_mode || ""),
        openrouterModel: clean(response?.model),
        contentPreview: content.slice(0, 500),
      },
    },
  },
];
