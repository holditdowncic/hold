import { NextRequest, NextResponse } from "next/server";
import { saveFormSubmission, type FormSubmissionInput, type FormSubmissionSaveResult } from "./form-submissions";

export type RootsAndWingsFeedbackDependencies = {
  saveSubmission?: (input: FormSubmissionInput) => Promise<FormSubmissionSaveResult>;
  fetchImpl?: typeof fetch;
  telegramBotToken?: string;
  telegramAdminIds?: string[];
};

const formType = "roots_and_wings_feedback";
const sourcePath = "/roots-and-wings-feedback";
const subject = "Roots & Wings feedback";

const connectedImpactOptions = ["Yes, significantly", "Yes, somewhat", "No change", "Not sure"];
const attendAgainOptions = ["Yes", "No", "Maybe"];
const recommendOptions = ["Definitely", "Probably", "Not sure", "Probably not", "Definitely not"];
const hearFutureEventsOptions = ["Yes", "No"];
const ageGroupOptions = ["Under 16", "16-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const genderOptions = ["Male", "Female", "Non-binary", "Prefer to self-describe", "Prefer not to say"];

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanLongText(value: unknown, maxLength = 1500) {
  return cleanText(value).slice(0, maxLength);
}

function parseRating(value: unknown) {
  const text = cleanText(value);
  if (!/^[1-5]$/.test(text)) return null;
  return Number(text);
}

function cleanChoice(value: unknown, options: string[]) {
  const text = cleanText(value);
  if (!text) return "";
  return options.includes(text) ? text : null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function telegramLine(label: string, value: string | number | null | undefined) {
  if (value === undefined || value === null || value === "") return null;
  return `<b>${escapeHtml(label)}:</b> ${escapeHtml(String(value))}`;
}

function clipForTelegram(value: string, maxLength = 700) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}

function resolveAdminIds(explicit?: string[]) {
  if (explicit) return explicit;
  return (process.env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

async function notifyTelegram(
  payload: {
    overallSatisfaction: number;
    activitiesSatisfaction: number;
    favoritePart: string;
    takingAway: string;
    connectedImpact: string;
    attendAgain: string;
    recommend: string;
    hearFutureEvents: string;
    email: string;
  },
  deps: RootsAndWingsFeedbackDependencies,
) {
  const botToken = deps.telegramBotToken ?? process.env.TELEGRAM_BOT_TOKEN;
  const adminIds = resolveAdminIds(deps.telegramAdminIds);
  if (!botToken || adminIds.length === 0) {
    console.error("Roots & Wings feedback Telegram notification skipped: bot token or admin ids missing");
    return;
  }

  const text = [
    "📝 <b>Roots &amp; Wings feedback</b>",
    "",
    telegramLine("Overall satisfaction", `${payload.overallSatisfaction}/5`),
    telegramLine("Children and young people activities", `${payload.activitiesSatisfaction}/5`),
    telegramLine("Connected to family, community, or wellbeing", payload.connectedImpact),
    telegramLine("Attend again", payload.attendAgain),
    telegramLine("Recommend", payload.recommend),
    telegramLine("Hear future events", payload.hearFutureEvents),
    payload.email ? telegramLine("Email", payload.email) : null,
    payload.favoritePart ? ["", "<b>Favourite part:</b>", escapeHtml(clipForTelegram(payload.favoritePart))].join("\n") : null,
    payload.takingAway ? ["", "<b>Taking away:</b>", escapeHtml(clipForTelegram(payload.takingAway))].join("\n") : null,
    "",
    "—",
    "<i>Sent from /roots-and-wings-feedback</i>",
  ]
    .filter(Boolean)
    .join("\n");

  const fetchImpl = deps.fetchImpl ?? fetch;
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
        console.error("Roots & Wings feedback Telegram notification failed:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Roots & Wings feedback Telegram notification error:", error);
    }
  }));
}

export async function handleRootsAndWingsFeedbackSubmission(
  request: NextRequest,
  deps: RootsAndWingsFeedbackDependencies = {},
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please answer both satisfaction rating questions." },
      { status: 400 },
    );
  }

  const bodyRecord = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const overallSatisfaction = parseRating(bodyRecord.overallSatisfaction);
  const activitiesSatisfaction = parseRating(bodyRecord.activitiesSatisfaction);
  if (!overallSatisfaction || !activitiesSatisfaction) {
    return NextResponse.json(
      { error: "Please answer both satisfaction rating questions." },
      { status: 400 },
    );
  }

  const connectedImpact = cleanChoice(bodyRecord.connectedImpact, connectedImpactOptions);
  const attendAgain = cleanChoice(bodyRecord.attendAgain, attendAgainOptions);
  const recommend = cleanChoice(bodyRecord.recommend, recommendOptions);
  const hearFutureEvents = cleanChoice(bodyRecord.hearFutureEvents, hearFutureEventsOptions);
  const ageGroup = cleanChoice(bodyRecord.ageGroup, ageGroupOptions);
  const gender = cleanChoice(bodyRecord.gender, genderOptions);
  if ([connectedImpact, attendAgain, recommend, hearFutureEvents, ageGroup, gender].some((value) => value === null)) {
    return NextResponse.json(
      { error: "Please choose one of the available feedback options." },
      { status: 400 },
    );
  }

  const email = cleanText(bodyRecord.email).toLowerCase();
  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const payload = {
    overallSatisfaction,
    activitiesSatisfaction,
    favoritePart: cleanLongText(bodyRecord.favoritePart),
    takingAway: cleanLongText(bodyRecord.takingAway),
    connectedImpact: connectedImpact || "",
    futureSuggestions: cleanLongText(bodyRecord.futureSuggestions),
    attendAgain: attendAgain || "",
    recommend: recommend || "",
    hearFutureEvents: hearFutureEvents || "",
    email,
    ageGroup: ageGroup || "",
    gender: gender || "",
    event: "Roots & Wings",
  };

  const saveSubmission = deps.saveSubmission ?? saveFormSubmission;
  const savedSubmission = await saveSubmission({
    formType,
    sourcePath,
    payload,
    request,
    contactEmail: email,
    subject,
  });

  if (!savedSubmission.saved) {
    return NextResponse.json(
      { error: "The feedback form is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  await notifyTelegram(payload, deps);

  return NextResponse.json({ success: true, redirectTo: "/roots-and-wings" });
}
