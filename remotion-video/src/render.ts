import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { parseFile } from "music-metadata";

interface RenderInput {
  clipUrls: string[];
  videoMode?: string;
  targetDurationSec?: number;
  sourceVideoUrl?: string;
  meetingConfig?: {
    reelCount?: number;
    minClipSeconds?: number;
    targetClipSeconds?: number;
    maxClipSeconds?: number;
    transcriptionPrompt?: string;
    language?: string;
    preserveSourceAudio?: boolean;
    [key: string]: any;
  };
  renderConfig?: {
    talkingHeadSingleImage?: boolean;
    [key: string]: any;
  };
  // Optional: when clipUrls are not ready yet, pass fal queue request ids/urls.
  // The GitHub Action can resolve these into mp4 URLs before rendering.
  clipRequests?: Array<{
    requestId?: string;
    request_id?: string;
    statusUrl?: string;
    status_url?: string;
    responseUrl?: string;
    response_url?: string;
    duration?: number;
    index?: number;
  }>;
  // Optional: founder portrait pool for identity anchoring in scene-image generation.
  creatorImageUrl?: string;
  creatorImageUrls?: string[];
  audioUrl?: string;
  narrationText?: string;
  voiceId?: string;
  n8nWebhookUrl?: string;
  scenes: Array<{
    narration: string;
    visualPrompt: string;
    type: string;
    duration: number;
    index: number;
    // Optional: richer prompts produced by n8n.
    videoPrompt?: string;
    sceneImagePrompt?: string;
    creatorImageUrl?: string;
    creatorImageUrls?: string[];
    startSec?: number;
    endSec?: number;
    timedWords?: Array<{
      word: string;
      startSec: number;
      endSec: number;
    }>;
  }>;
  title: string;
  chatId: string;
}

interface MeetingWordTiming {
  word: string;
  startSec: number;
  endSec: number;
  speaker?: string;
}

interface TranscriptChunk {
  text: string;
  startSec: number;
  endSec: number;
  speaker?: string;
}

interface MeetingHighlight {
  title: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  text: string;
  speaker?: string;
  score: number;
}

interface RenderJob {
  title: string;
  description?: string;
  chatId: string;
  clipUrls: string[];
  scenes: RenderInput["scenes"];
  audioUrl?: string;
  narrationText?: string;
  voiceId?: string;
  includeClipAudio?: boolean;
  generatedAudioPath?: string;
}

const BUNDLED_TALKING_HEAD_REFERENCE_URLS = [
  "https://srv1417199.hstgr.cloud/public/founders/malcolm-20260320-portrait-01.jpeg",
  "https://srv1417199.hstgr.cloud/public/founders/malcolm-20260320-portrait-02.jpeg",
  "https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_casual.png",
  "https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_suit.png",
];

function parseRenderInput(rawInput: string): RenderInput {
  const parsed = JSON.parse(rawInput);
  let candidate: any = parsed;

  // repository_dispatch payload is often wrapped for GitHub limits:
  // client_payload: { job: { ...actual render input... } }
  if (candidate && typeof candidate === "object" && candidate.job) {
    candidate = candidate.job;
  }

  if (candidate && typeof candidate === "object" && typeof candidate.payloadJson === "string") {
    candidate = JSON.parse(candidate.payloadJson);
  }

  if (candidate && typeof candidate === "object" && typeof candidate.payloadB64 === "string") {
    const decoded = Buffer.from(candidate.payloadB64, "base64").toString("utf8");
    candidate = JSON.parse(decoded);
  }

  return {
    ...candidate,
    clipUrls: Array.isArray(candidate?.clipUrls) ? candidate.clipUrls : [],
    videoMode: clean(candidate?.videoMode || candidate?.video_mode),
    targetDurationSec: Number(candidate?.targetDurationSec) || 0,
    renderConfig: candidate?.renderConfig || {},
    sourceVideoUrl: clean(candidate?.sourceVideoUrl || candidate?.source_video_url),
    meetingConfig:
      candidate?.meetingConfig && typeof candidate.meetingConfig === "object"
        ? candidate.meetingConfig
        : {},
    clipRequests: Array.isArray(candidate?.clipRequests) ? candidate.clipRequests : [],
    creatorImageUrl: clean(candidate?.creatorImageUrl),
    creatorImageUrls: Array.isArray(candidate?.creatorImageUrls) ? candidate.creatorImageUrls : [],
    scenes: Array.isArray(candidate?.scenes) ? candidate.scenes : [],
    title: String(candidate?.title || "Untitled Video"),
    chatId: String(candidate?.chatId || ""),
  } as RenderInput;
}

function isTalkingHeadInput(
  input: RenderInput,
  scenes: Array<any> = []
): boolean {
  const mode = clean(input.videoMode).toLowerCase();
  if (mode === "meeting_reels") return false;
  const target = Number(input.targetDurationSec || 0);
  const configFlag = Boolean((input.renderConfig as any)?.talkingHeadSingleImage);
  // Safety net: this workflow's multi-clip path should always have >1 scene.
  // If we only received one scene, prefer the cheaper talking-head render path.
  const singleScene = scenes.length === 1;
  const singleLongScene =
    scenes.length === 1 && Number((scenes[0] as any)?.duration || 0) >= 25;
  return mode === "talking_head" || target >= 30 || configFlag || singleLongScene || singleScene;
}

function isMeetingReelsInput(input: RenderInput): boolean {
  return clean(input.videoMode).toLowerCase() === "meeting_reels";
}

function clean(s: unknown): string {
  return String(s ?? "").trim();
}

function normalizeSpeechText(text: string): string {
  let out = String(text || "");

  // Lock brand pronunciation to the literal brand word in speech text.
  // This avoids unstable results from phonetic spellings across voices/models.
  out = out.replace(/\bDig[-\s]?nih[-\s]?tayt'?s\b/gi, "Dignitate's");
  out = out.replace(/\bDig[-\s]?nih[-\s]?tayt\b/gi, "Dignitate");
  out = out.replace(/\bDig[-\s]?ni[-\s]?tate'?s\b/gi, "Dignitate's");
  out = out.replace(/\bDig[-\s]?ni[-\s]?tate\b/gi, "Dignitate");
  out = out.replace(/\bDignita+te'?s\b/gi, "Dignitate's");
  out = out.replace(/\bDignita+te\b/gi, "Dignitate");

  return out;
}

function hashSeed(str: string): number {
  // Stable cross-run seed for deterministic-ish variation.
  const s = clean(str);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function appendPrompt(base: string, tail: string): string {
  const b = clean(base);
  const t = clean(tail);
  if (!b) return t;
  if (!t) return b;
  const lowerB = b.toLowerCase();
  const lowerT = t.toLowerCase();
  // Avoid runaway duplication when prompts already include the same hard-lock phrases.
  if (lowerB.includes(lowerT)) return b;
  return `${b}. ${t}`;
}

function looksLikeUrl(u: string): boolean {
  return /^https?:\/\//i.test(clean(u));
}

function isZoomRecordingShareUrl(u: string): boolean {
  try {
    const parsed = new URL(clean(u));
    return /(^|\.)zoom\.us$/i.test(parsed.hostname) && /^\/rec\/share\//i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function looksLikeVideoUrl(u: string): boolean {
  const s = clean(u);
  if (!looksLikeUrl(s)) return false;
  const lower = s.toLowerCase();
  const bare = lower.split("?")[0].split("#")[0];
  if (bare.endsWith(".mp4") || bare.endsWith(".mov") || bare.endsWith(".webm") || bare.endsWith(".m3u8")) return true;
  if (lower.includes("fal.media/files/")) return true;
  return false;
}

function looksLikeImageUrl(u: string): boolean {
  const s = clean(u);
  if (!looksLikeUrl(s)) return false;
  const lower = s.toLowerCase();
  const bare = lower.split("?")[0].split("#")[0];
  if (bare.endsWith(".png") || bare.endsWith(".jpg") || bare.endsWith(".jpeg") || bare.endsWith(".webp")) return true;
  if (lower.includes("fal.media/files/")) return true;
  return false;
}

function getRequestId(req: any): string {
  return clean(req?.requestId || req?.request_id);
}

function getStatusUrl(req: any): string {
  return clean(req?.statusUrl || req?.status_url);
}

function getResponseUrl(req: any): string {
  return clean(req?.responseUrl || req?.response_url);
}

function pickFirstVideoUrl(payload: any): string {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (v: any) => {
    const u = clean(v);
    if (!u || seen.has(u) || !looksLikeVideoUrl(u)) return;
    seen.add(u);
    out.push(u);
  };

  const walk = (node: any, depth = 0) => {
    if (node == null || depth > 8) return;
    if (typeof node === "string") {
      push(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const x of node) walk(x, depth + 1);
      return;
    }
    if (typeof node !== "object") return;

    push((node as any)?.video?.url);
    push((node as any)?.data?.video?.url);
    push((node as any)?.output?.video?.url);
    push((node as any)?.result?.video?.url);
    push((node as any)?.response?.video?.url);
    push((node as any)?.video_url);
    push((node as any)?.videoUrl);
    push((node as any)?.url);

    for (const v of Object.values(node as any)) walk(v, depth + 1);
  };

  walk(payload);
  return out[0] || "";
}

function pickFirstImageUrl(payload: any): string {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (v: any) => {
    const u = clean(v);
    if (!u || seen.has(u) || !looksLikeImageUrl(u)) return;
    // Filter out queue/status urls
    if (u.includes("queue.fal.run") && u.includes("/requests/")) return;
    seen.add(u);
    out.push(u);
  };

  const walk = (node: any, depth = 0) => {
    if (node == null || depth > 8) return;
    if (typeof node === "string") {
      push(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const x of node) walk(x, depth + 1);
      return;
    }
    if (typeof node !== "object") return;

    push((node as any)?.url);
    push((node as any)?.image_url);
    push((node as any)?.imageUrl);
    push((node as any)?.data?.image?.url);
    push((node as any)?.data?.images?.[0]?.url);
    push((node as any)?.images?.[0]?.url);

    for (const v of Object.values(node as any)) walk(v, depth + 1);
  };

  walk(payload);
  return out[0] || "";
}

async function falGetJson(url: string, falKey: string): Promise<any> {
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Key ${falKey}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`fal GET failed (${res.status}) for ${url}: ${body.slice(0, 200)}`);
  }
  return await res.json();
}

async function falPostJson(url: string, body: any, falKey: string): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal POST failed (${res.status}) for ${url}: ${text.slice(0, 200)}`);
  }
  return await res.json();
}

async function resolveFalClipUrl(
  req: any,
  falKey: string,
  opts: { pollIntervalMs: number; maxWaitMs: number; modelPath?: string }
): Promise<string> {
  const requestId = getRequestId(req);
  const statusUrl = getStatusUrl(req);
  const responseUrl = getResponseUrl(req);

  const modelPath = clean(opts.modelPath) || "fal-ai/kling-video";

  const fallbackStatusUrl = requestId
    ? `https://queue.fal.run/${modelPath}/requests/${encodeURIComponent(requestId)}/status`
    : "";
  const fallbackResponseUrl = requestId
    ? `https://queue.fal.run/${modelPath}/requests/${encodeURIComponent(requestId)}`
    : "";

  const started = Date.now();
  const deadline = started + opts.maxWaitMs;
  let lastQueuePos: number | null = null;

  while (Date.now() < deadline) {
    let status: string = "";
    try {
      const sUrl = looksLikeUrl(statusUrl) ? statusUrl : fallbackStatusUrl;
      if (sUrl) {
        const statusJson = await falGetJson(sUrl, falKey);
        status = clean(
          statusJson?.status || statusJson?.data?.status || statusJson?.request_status || ""
        ).toUpperCase();
        const qpRaw = (statusJson?.queue_position ?? statusJson?.data?.queue_position ?? null) as any;
        const qp = qpRaw == null ? null : Number(qpRaw);
        if (qp != null && Number.isFinite(qp) && qp !== lastQueuePos) {
          lastQueuePos = qp;
          console.log(`fal clip status: ${status || "UNKNOWN"} (queue_position=${qp})`);
        }
        if (["FAILED", "ERROR", "CANCELLED"].includes(status)) {
          throw new Error(`fal clip request failed: status=${status}`);
        }
      }
    } catch (e) {
      // Status can be flaky; don't fail solely on status polling.
      console.log(`fal clip status warning: ${String((e as any)?.message || e).slice(0, 160)}`);
    }

    try {
      const rUrl = looksLikeUrl(responseUrl) ? responseUrl : fallbackResponseUrl;
      if (rUrl) {
        // Avoid hammering the result endpoint while still in queue.
        if (!status || status === "COMPLETED") {
          const resultJson = await falGetJson(rUrl, falKey);
          const direct = pickFirstVideoUrl(resultJson) || pickFirstVideoUrl(req);
          if (direct) return direct;
        }
      }
    } catch (e) {
      const msg = String((e as any)?.message || e);
      if (/audio_url/i.test(msg) || /image_url/i.test(msg)) {
        throw new Error(`fal clip request rejected: ${msg.slice(0, 220)}`);
      }
      // fal returns 400 with "Request is still in progress" until the result is ready.
      if (!/Request is still in progress/i.test(msg)) {
        console.log(`fal clip result warning: ${msg.slice(0, 160)}`);
      }
    }

    await new Promise((r) => setTimeout(r, opts.pollIntervalMs));
  }

  throw new Error(
    `Timed out waiting for fal clip (requestId=${requestId || "n/a"}) after ${Math.round(
      opts.maxWaitMs / 1000
    )}s`
  );
}

async function resolveFalImageUrl(
  req: any,
  falKey: string,
  opts: { pollIntervalMs: number; maxWaitMs: number; modelPath: string }
): Promise<string> {
  const requestId = getRequestId(req);
  const statusUrl = getStatusUrl(req);
  const responseUrl = getResponseUrl(req);

  const fallbackStatusUrl = requestId
    ? `https://queue.fal.run/${opts.modelPath}/requests/${encodeURIComponent(requestId)}/status`
    : "";
  const fallbackResponseUrl = requestId
    ? `https://queue.fal.run/${opts.modelPath}/requests/${encodeURIComponent(requestId)}`
    : "";

  const started = Date.now();
  const deadline = started + opts.maxWaitMs;
  let lastQueuePos: number | null = null;

  while (Date.now() < deadline) {
    let status: string = "";
    try {
      const sUrl = looksLikeUrl(statusUrl) ? statusUrl : fallbackStatusUrl;
      if (sUrl) {
        const statusJson = await falGetJson(sUrl, falKey);
        status = clean(
          statusJson?.status || statusJson?.data?.status || statusJson?.request_status || ""
        ).toUpperCase();
        const qpRaw = (statusJson?.queue_position ?? statusJson?.data?.queue_position ?? null) as any;
        const qp = qpRaw == null ? null : Number(qpRaw);
        if (qp != null && Number.isFinite(qp) && qp !== lastQueuePos) {
          lastQueuePos = qp;
          console.log(`fal image status: ${status || "UNKNOWN"} (queue_position=${qp})`);
        }
        if (["FAILED", "ERROR", "CANCELLED"].includes(status)) {
          throw new Error(`fal image request failed: status=${status}`);
        }
      }
    } catch (e) {
      // Status can be flaky; don't fail solely on status polling.
      console.log(`fal image status warning: ${String((e as any)?.message || e).slice(0, 160)}`);
    }

    try {
      const rUrl = looksLikeUrl(responseUrl) ? responseUrl : fallbackResponseUrl;
      if (rUrl) {
        // Avoid hammering the result endpoint while still in queue.
        if (!status || status === "COMPLETED") {
          const resultJson = await falGetJson(rUrl, falKey);
          const direct = pickFirstImageUrl(resultJson) || pickFirstImageUrl(req);
          if (direct) return direct;
        }
      }
    } catch (e) {
      const msg = String((e as any)?.message || e);
      // fal returns 400 with "Request is still in progress" until the result is ready.
      if (!/Request is still in progress/i.test(msg)) {
        console.log(`fal image result warning: ${msg.slice(0, 160)}`);
      }
    }

    await new Promise((r) => setTimeout(r, opts.pollIntervalMs));
  }

  throw new Error(
    `Timed out waiting for fal image (requestId=${requestId || "n/a"}) after ${Math.round(
      opts.maxWaitMs / 1000
    )}s`
  );
}

async function resolveClipUrlsFromFal(
  clipRequests: RenderInput["clipRequests"]
): Promise<string[]> {
  const falKey = String(process.env.FAL_KEY || "").trim();
  if (!falKey) {
    throw new Error("clipRequests were provided but FAL_KEY is missing in GitHub Actions secrets/env.");
  }

  const reqs = (clipRequests || []).filter(Boolean);
  if (reqs.length === 0) return [];

  console.log(`Resolving ${reqs.length} clip request(s) via fal queue...`);
  const pollIntervalMs = 4000;
  const maxWaitMs = 22 * 60 * 1000;

  const concurrency = 3;
  const results: string[] = new Array(reqs.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= reqs.length) return;
      const url = await resolveFalClipUrl(reqs[i], falKey, { pollIntervalMs, maxWaitMs });
      results[i] = url;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, reqs.length) }, () => worker()));
  const resolved = results.filter((u) => looksLikeVideoUrl(u));

  if (resolved.length !== reqs.length) {
    throw new Error(`Failed to resolve all clip request URLs (${resolved.length}/${reqs.length})`);
  }

  return resolved;
}

function normalizeUrlList(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of list) {
    const u = clean(v);
    if (!looksLikeUrl(u)) continue;
    const k = u.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(u);
  }
  return out;
}

function normalizeEnvUrlList(value: string): string[] {
  return String(value || "")
    .split(/[,\n]/)
    .map((part) => clean(part))
    .filter(Boolean)
    .filter((url) => looksLikeUrl(url));
}

function mergeUrlLists(...lists: Array<unknown>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    const values = Array.isArray(list) ? list : [];
    for (const raw of values) {
      const url = clean(raw);
      if (!looksLikeUrl(url)) continue;
      const key = url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(url);
    }
  }
  return out;
}

function getTalkingHeadReferenceDefaults(): string[] {
  const configured = normalizeEnvUrlList(String(process.env.TALKING_HEAD_REFERENCE_URLS || ""));
  return configured.length ? configured : BUNDLED_TALKING_HEAD_REFERENCE_URLS;
}

function slugify(value: string, fallback = "video"): string {
  const slug = clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

function normalizeMeetingConfig(input: RenderInput): Required<NonNullable<RenderInput["meetingConfig"]>> {
  const raw = (input.meetingConfig && typeof input.meetingConfig === "object"
    ? input.meetingConfig
    : {}) as Record<string, any>;

  const reelCount = Math.max(1, Math.min(5, Number(raw.reelCount) || 4));
  const minClipSeconds = Math.max(12, Math.min(45, Number(raw.minClipSeconds) || 22));
  const targetClipSeconds = Math.max(
    minClipSeconds,
    Math.min(60, Number(raw.targetClipSeconds) || 32)
  );
  const maxClipSeconds = Math.max(
    targetClipSeconds,
    Math.min(75, Number(raw.maxClipSeconds) || 42)
  );

  return {
    reelCount,
    minClipSeconds,
    targetClipSeconds,
    maxClipSeconds,
    transcriptionPrompt: clean(raw.transcriptionPrompt),
    language: clean(raw.language),
    preserveSourceAudio:
      raw.preserveSourceAudio === false ? false : true,
  };
}

function cleanTranscriptText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

async function resolveFalResultJson(
  req: any,
  falKey: string,
  opts: { pollIntervalMs: number; maxWaitMs: number; modelPath: string }
): Promise<any> {
  const requestId = getRequestId(req);
  const statusUrl = getStatusUrl(req);
  const responseUrl = getResponseUrl(req);

  const fallbackStatusUrl = requestId
    ? `https://queue.fal.run/${opts.modelPath}/requests/${encodeURIComponent(requestId)}/status`
    : "";
  const fallbackResponseUrl = requestId
    ? `https://queue.fal.run/${opts.modelPath}/requests/${encodeURIComponent(requestId)}`
    : "";

  const started = Date.now();
  const deadline = started + opts.maxWaitMs;

  while (Date.now() < deadline) {
    let status = "";
    try {
      const sUrl = looksLikeUrl(statusUrl) ? statusUrl : fallbackStatusUrl;
      if (sUrl) {
        const statusJson = await falGetJson(sUrl, falKey);
        status = clean(
          statusJson?.status || statusJson?.data?.status || statusJson?.request_status || ""
        ).toUpperCase();
        if (["FAILED", "ERROR", "CANCELLED"].includes(status)) {
          throw new Error(`fal request failed: status=${status}`);
        }
      }
    } catch (e) {
      console.log(`fal result status warning: ${String((e as any)?.message || e).slice(0, 180)}`);
    }

    try {
      const rUrl = looksLikeUrl(responseUrl) ? responseUrl : fallbackResponseUrl;
      if (rUrl && (!status || status === "COMPLETED")) {
        const resultJson = await falGetJson(rUrl, falKey);
        if (resultJson && typeof resultJson === "object") {
          return resultJson;
        }
      }
    } catch (e) {
      const msg = String((e as any)?.message || e);
      if (!/Request is still in progress/i.test(msg)) {
        console.log(`fal result warning: ${msg.slice(0, 180)}`);
      }
    }

    await new Promise((r) => setTimeout(r, opts.pollIntervalMs));
  }

  throw new Error(
    `Timed out waiting for fal result (requestId=${requestId || "n/a"}) after ${Math.round(
      opts.maxWaitMs / 1000
    )}s`
  );
}

function normalizeTranscriptChunks(payload: any): TranscriptChunk[] {
  const source =
    (Array.isArray(payload?.chunks) && payload.chunks) ||
    (Array.isArray(payload?.segments) && payload.segments) ||
    (Array.isArray(payload?.data?.chunks) && payload.data.chunks) ||
    (Array.isArray(payload?.data?.segments) && payload.data.segments) ||
    [];

  return source
    .map((item: any) => {
      const text = cleanTranscriptText(item?.text || item?.content || item?.transcript || "");
      const ts = Array.isArray(item?.timestamp)
        ? item.timestamp
        : Array.isArray(item?.timestamps)
          ? item.timestamps
          : null;
      const startSec = Number(item?.start ?? item?.start_time ?? ts?.[0] ?? 0);
      const endSec = Number(item?.end ?? item?.end_time ?? ts?.[1] ?? startSec);
      const speaker = clean(item?.speaker ?? item?.speaker_id ?? item?.speakerId);
      return {
        text,
        startSec: Number.isFinite(startSec) ? Math.max(0, startSec) : 0,
        endSec: Number.isFinite(endSec) ? Math.max(startSec, endSec) : Math.max(0, startSec),
        speaker: speaker || undefined,
      };
    })
    .filter((item: TranscriptChunk) => item.text && item.endSec > item.startSec);
}

function normalizeTranscriptWords(payload: any): MeetingWordTiming[] {
  const source =
    (Array.isArray(payload?.chunks) && payload.chunks) ||
    (Array.isArray(payload?.words) && payload.words) ||
    (Array.isArray(payload?.data?.chunks) && payload.data.chunks) ||
    (Array.isArray(payload?.data?.words) && payload.data.words) ||
    [];

  return source
    .map((item: any) => {
      const word = cleanTranscriptText(item?.text || item?.word || item?.content || "");
      const ts = Array.isArray(item?.timestamp)
        ? item.timestamp
        : Array.isArray(item?.timestamps)
          ? item.timestamps
          : null;
      const startSec = Number(item?.start ?? item?.start_time ?? ts?.[0] ?? 0);
      const endSec = Number(item?.end ?? item?.end_time ?? ts?.[1] ?? startSec);
      return {
        word,
        startSec: Number.isFinite(startSec) ? Math.max(0, startSec) : 0,
        endSec: Number.isFinite(endSec) ? Math.max(startSec, endSec) : Math.max(0, startSec),
        speaker: clean(item?.speaker ?? item?.speaker_id ?? item?.speakerId) || undefined,
      };
    })
    .filter((item: MeetingWordTiming) => item.word);
}

function estimateWordsWithinChunk(chunk: TranscriptChunk): MeetingWordTiming[] {
  const words = chunk.text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const total = Math.max(0.08, chunk.endSec - chunk.startSec);
  const perWord = total / Math.max(1, words.length);
  return words.map((word, idx) => ({
    word,
    startSec: chunk.startSec + idx * perWord,
    endSec: chunk.startSec + (idx + 1) * perWord,
    speaker: chunk.speaker,
  }));
}

function endsWithSentenceBoundary(text: string): boolean {
  return /[.!?]["')\]]?$/.test(cleanTranscriptText(text));
}

function startsWithWeakMeetingLead(text: string): boolean {
  return /^(and|but|so|to|of|with|or|because|then|now|yeah|yes|no|well|um|uh|erm|ah|like|you know|i mean)\b/i.test(
    cleanTranscriptText(text)
  );
}

function scoreMeetingLeadQuality(text: string): number {
  const normalized = cleanTranscriptText(text);
  if (!normalized) return -18;

  let score = 0;
  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
  const firstWordCount = firstSentence.split(/\s+/).filter(Boolean).length;

  if (/^[A-Z0-9"'(]/.test(normalized)) score += 6;
  if (firstWordCount >= 7) score += 6;
  if (endsWithSentenceBoundary(firstSentence)) score += 4;

  if (startsWithWeakMeetingLead(normalized)) score -= 16;
  if (
    /^(touch me|you just said|and i really|i still have for her|after mum|to be this carer|go through that)\b/i.test(
      normalized
    )
  ) {
    score -= 24;
  }

  if (
    /\b(one of the greatest risks|the biggest gap|it defines you|it throws you into deep poverty|we still have to work|because of my journey|25 years in luxury retail)\b/i.test(
      normalized
    )
  ) {
    score += 12;
  }

  return score;
}

function buildMeetingSentences(chunks: TranscriptChunk[]): TranscriptChunk[] {
  const sentences: TranscriptChunk[] = [];
  let currentWords: MeetingWordTiming[] = [];

  const flushSentence = () => {
    if (!currentWords.length) return;
    const text = cleanTranscriptText(currentWords.map((word) => word.word).join(" "));
    if (!text) {
      currentWords = [];
      return;
    }

    const speakerCounts = new Map<string, number>();
    for (const word of currentWords) {
      if (!word.speaker) continue;
      speakerCounts.set(word.speaker, (speakerCounts.get(word.speaker) || 0) + 1);
    }
    let speaker: string | undefined;
    if (speakerCounts.size) {
      speaker = [...speakerCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }

    sentences.push({
      text,
      startSec: currentWords[0].startSec,
      endSec: currentWords[currentWords.length - 1].endSec,
      speaker,
    });
    currentWords = [];
  };

  for (const chunk of chunks) {
    const words = estimateWordsWithinChunk(chunk);
    if (!words.length) continue;

    for (const word of words) {
      if (
        currentWords.length &&
        word.startSec - currentWords[currentWords.length - 1].endSec > 1.8 &&
        currentWords.length >= 6
      ) {
        flushSentence();
      }

      currentWords.push(word);

      if (/[.!?]["')\]]?$/.test(word.word) && currentWords.length >= 6) {
        flushSentence();
      }
    }
  }

  flushSentence();

  return sentences.filter((sentence) => {
    const wordCount = sentence.text.split(/\s+/).filter(Boolean).length;
    return sentence.endSec > sentence.startSec && wordCount >= 6;
  });
}

function buildMeetingSceneTitle(baseTitle: string, index: number, text: string): string {
  const cleaned = cleanTranscriptText(text).replace(/[.!?]+$/g, "");
  const preview = cleaned.split(/\s+/).slice(0, 6).join(" ");
  return `${baseTitle} - Reel ${index + 1}${preview ? ` - ${preview}` : ""}`;
}

function buildMeetingSceneDescription(text: string): string {
  const cleaned = cleanTranscriptText(text);
  if (!cleaned) return "";
  const firstSentence = cleaned.match(/^(.+?[.!?])(?:\s|$)/);
  const summary = clean(firstSentence?.[1] || cleaned);
  return summary.length > 220 ? `${summary.slice(0, 217).trim()}...` : summary;
}

function scoreMeetingCandidate(
  text: string,
  durationSec: number,
  speakerCount: number,
  segmentCount: number,
  opts: { primarySpeaker: boolean }
): number {
  const normalized = cleanTranscriptText(text);
  const words = normalized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (!wordCount || durationSec <= 0) return -999;

  let score = 0;
  score += Math.max(0, 30 - Math.abs(durationSec - 30));
  score += Math.min(24, wordCount / 3);
  score += scoreMeetingLeadQuality(normalized);
  if (speakerCount === 1) score += 16;
  else if (speakerCount === 2) score += 8;
  else score -= speakerCount * 6;
  if (opts.primarySpeaker) score += 12;
  else if (speakerCount === 1) score -= 8;
  if (segmentCount >= 2 && segmentCount <= 6) score += 6;
  if (endsWithSentenceBoundary(normalized)) score += 6;
  if (/\b(important|key|need to|we need|must|should|today|now|because|so that|next step|action|plan|risk|opportunity|learned|found|decision)\b/i.test(normalized)) {
    score += 12;
  }
  if (/\b\d+(?:\.\d+)?%?\b/.test(normalized)) score += 4;
  if (/\b(um|uh|erm|ah|like|you know|sort of|kind of)\b/i.test(normalized)) score -= 8;
  if (/\b(can you hear me|you'?re on mute|screen share|share my screen|recording now|thank you everyone|hello everyone|good morning everyone|agenda|next slide|take questions)\b/i.test(normalized)) {
    score -= 26;
  }
  if (wordCount < 18) score -= 10;
  if (durationSec > 48) score -= 10;
  return score;
}

function pickMeetingHighlights(
  chunks: TranscriptChunk[],
  cfg: Required<NonNullable<RenderInput["meetingConfig"]>>,
  baseTitle: string
): MeetingHighlight[] {
  const sentenceChunks = buildMeetingSentences(chunks);
  const cleanChunks = (sentenceChunks.length ? sentenceChunks : chunks).filter(
    (chunk) => chunk.endSec > chunk.startSec && chunk.text
  );
  const speakerDurations = new Map<string, number>();
  for (const chunk of cleanChunks) {
    if (!chunk.speaker) continue;
    speakerDurations.set(
      chunk.speaker,
      (speakerDurations.get(chunk.speaker) || 0) + Math.max(0, chunk.endSec - chunk.startSec)
    );
  }
  const primarySpeaker =
    speakerDurations.size > 0
      ? [...speakerDurations.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : "";
  const candidates: MeetingHighlight[] = [];

  for (let i = 0; i < cleanChunks.length; i++) {
    let textParts: string[] = [];
    let endSec = cleanChunks[i].startSec;
    const speakers = new Set<string>();

    for (let j = i; j < cleanChunks.length; j++) {
      const chunk = cleanChunks[j];
      if (j > i && chunk.startSec - endSec > 2.8) break;

      textParts.push(chunk.text);
      endSec = chunk.endSec;
      if (chunk.speaker) speakers.add(chunk.speaker);

      const startSec = cleanChunks[i].startSec;
      const durationSec = endSec - startSec;
      if (durationSec > cfg.maxClipSeconds) break;
      if (durationSec < cfg.minClipSeconds) continue;

      const text = cleanTranscriptText(textParts.join(" "));
      const dominantCandidateSpeaker =
        speakers.size === 1 ? [...speakers][0] : undefined;
      const score = scoreMeetingCandidate(text, durationSec, speakers.size || 1, j - i + 1, {
        primarySpeaker: Boolean(primarySpeaker && dominantCandidateSpeaker === primarySpeaker),
      });
      candidates.push({
        title: buildMeetingSceneTitle(baseTitle, candidates.length, text),
        startSec,
        endSec,
        durationSec,
        text,
        speaker: speakers.size === 1 ? [...speakers][0] : undefined,
        score,
      });
    }
  }

  const sorted = candidates.sort((a, b) => b.score - a.score);
  const selected: MeetingHighlight[] = [];

  for (const candidate of sorted) {
    const overlaps = selected.some((picked) => {
      const latestStart = Math.max(candidate.startSec, picked.startSec);
      const earliestEnd = Math.min(candidate.endSec, picked.endSec);
      return earliestEnd - latestStart > 3;
    });
    if (overlaps) continue;
    selected.push({
      ...candidate,
      title: buildMeetingSceneTitle(baseTitle, selected.length, candidate.text),
    });
    if (selected.length >= cfg.reelCount) break;
  }

  return selected.sort((a, b) => a.startSec - b.startSec);
}

async function extractAudioFromVideo(
  videoPath: string,
  audioPath: string
): Promise<string> {
  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) {
    throw new Error("ffmpeg is required to extract audio from meeting recordings.");
  }

  const res = await runCmd("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    videoPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "96k",
    audioPath,
  ]);

  if (res.code !== 0 || !fs.existsSync(audioPath)) {
    throw new Error(`Failed to extract audio from meeting video: ${String(res.stderr || "").slice(0, 220)}`);
  }

  return audioPath;
}

function splitKlingMultiPromptDurations(totalSeconds: number): number[] {
  const total = Math.max(3, Math.round(Number(totalSeconds) || 0));
  if (total < 6) return [total];
  if (total <= 10) {
    const first = Math.floor(total / 2);
    const second = total - first;
    if (first >= 3 && second >= 3) return [first, second];
  }
  const a = Math.floor(total / 3);
  const b = Math.floor((total - a) / 2);
  const c = total - a - b;
  if (a >= 3 && b >= 3 && c >= 3) return [a, b, c];
  if (total === 11) return [3, 4, 4];
  if (total === 13) return [4, 4, 5];
  if (total === 14) return [4, 5, 5];
  if (total === 15) return [5, 5, 5];
  return [Math.max(3, total - 3), 3];
}

function buildKlingMultiPrompt(basePrompt: string, duration: number): Array<{ prompt: string; duration: string }> | null {
  const parts = splitKlingMultiPromptDurations(duration);
  if (parts.length < 2) return null;

  const shotDirectives =
    parts.length === 2
      ? [
          "Shot 1 of 2. Frontal establishing angle, eye-level medium shot, steady camera, clear subject introduction.",
          "Shot 2 of 2. Three-quarter angle with slight side perspective, subtle reframing, same scene continuity."
        ]
      : [
          "Shot 1 of 3. Frontal establishing angle, eye-level medium shot, steady camera, clear subject introduction.",
          "Shot 2 of 3. Three-quarter angle with closer detail and subtle parallax, same scene continuity.",
          "Shot 3 of 3. Wider contextual angle in the same environment, gentle camera reset, same subject continuity."
        ];

  return parts.map((seconds, index) => ({
    prompt: appendPrompt(basePrompt, shotDirectives[index] || shotDirectives[shotDirectives.length - 1]),
    duration: String(seconds),
  }));
}

async function generateClipsFromScenes(
  input: RenderInput
): Promise<string[]> {
  const falKey = String(process.env.FAL_KEY || "").trim();
  if (!falKey) {
    throw new Error("Generating clips from scenes requires FAL_KEY.");
  }

  const scenes = Array.isArray(input.scenes) ? input.scenes : [];
  if (scenes.length === 0) return [];
  const singleSceneTalkingHead = isTalkingHeadInput(input, scenes);

  const basePool = normalizeUrlList(input.creatorImageUrls);
  const baseSingle = clean(input.creatorImageUrl);
  const talkingHeadDefaults = getTalkingHeadReferenceDefaults();

  // Use the same image-generation family as the carousel flow for visual consistency.
  const nanoModels = [
    {
      url: "https://queue.fal.run/fal-ai/nano-banana-2/edit",
      modelPath: "fal-ai/nano-banana-2/edit",
      label: "nano-banana-2",
    },
  ];
  // Kling v3 standard supports native 9:16 output. (O3 often does not expose aspect_ratio.)
  const klingUrl = "https://queue.fal.run/fal-ai/kling-video/v3/standard/image-to-video";
  const klingModelPath = "fal-ai/kling-video/v3/standard/image-to-video";
  const ltxTalkingHeadUrl = "https://queue.fal.run/fal-ai/ltx-2-19b/audio-to-video";
  const ltxTalkingHeadModelPath = "fal-ai/ltx-2-19b/audio-to-video";
  const videoNegativePrompt =
    "subtitles, captions, closed captions, lower thirds, on-screen text, words, letters, typography, title cards, watermark, logo, branding, ticker, UI chrome, interface elements, split screen, collage, duplicate face, extra mouth, distorted mouth, unreadable text, gibberish text";

  const pollIntervalMs = 4000;
  const maxWaitMs = 22 * 60 * 1000;

  const concurrency = 2;
  const results: string[] = new Array(scenes.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= scenes.length) return;
      const s = scenes[i] as any;

      const scenePool = normalizeUrlList(s.creatorImageUrls).length
        ? normalizeUrlList(s.creatorImageUrls)
        : (basePool.length ? basePool : (baseSingle ? [baseSingle] : []));
      const pool = mergeUrlLists(scenePool, baseSingle ? [baseSingle] : [], talkingHeadDefaults);
      if (pool.length === 0) {
        throw new Error("No creatorImageUrls available for identity anchoring.");
      }
      console.log(
        `Scene ${i + 1}: identity reference pool size ${pool.length}${singleSceneTalkingHead ? " (talking-head)" : " (scene-image/Kling)"}`
      );

      const sceneImagePrompt = clean(s.sceneImagePrompt || s.visualPrompt || "");
      const videoPrompt = clean(s.videoPrompt || s.visualPrompt || "");
      const duration = Number(s.duration) && Number(s.duration) > 0 ? Number(s.duration) : 15;
      const portraitPolish = singleSceneTalkingHead
        ? "Flattering portrait lighting, confident and engaged expression, realistic but rested appearance, natural skin texture, avoid exaggerated frown lines or harsh ageing cues. Preserve the same suit, tie, shirt, grooming, and overall identity from the reference image."
        : "";

      const imageHardLock =
        "Vertical 9:16. Photorealistic UK documentary/editorial. Chest-up framing only. Frame from slightly above the hairline to upper torso, with a little breathing room around the head and shoulders. The face should be prominent and centered, with eyes around the upper third. No waist visible, no lower torso, no full body, no knees, no feet, no long shot, no wide shot, no jacket buttons below the upper torso. Hands should not be visible. Use a simple uncluttered calm background. No borders, no black bars, no letterboxing. No collage or split-screen.";

      const videoHardLock =
        "Vertical 9:16. Subtle realistic motion (blink, small head movement, gentle gesture). Clean uncluttered composition. No borders, no black bars, no letterboxing. No collage or split-screen.";

      console.log(`Scene ${i + 1}/${scenes.length}: generating start frame...`);

      const sceneSeed = Number.isFinite(Number(s.sceneSeed))
        ? Number(s.sceneSeed)
        : hashSeed(`${input.title}|${input.chatId}|scene:${i}`);

      const talkingHeadIdentityLock =
        "Same exact person as the reference images. Preserve facial identity exactly: same ethnicity, age, skin tone, hairline, hairstyle, ears, eye shape, nose, jawline, beard pattern, smile, and overall face structure. Keep the same suit, tie, shirt, and grooming unless explicitly changed. Only change the setting around the same person.";
      const talkingHeadPodcastStyle =
        "Podcast/interview visual style. Same founder in a clean modern podcast studio or studio-interview setup, direct to camera, warm neutral lighting, shallow depth of field, tasteful background blur, premium microphone/podcast atmosphere, chest-up composition, single subject, vertical portrait.";

      const talkingHeadScenePrompt = appendPrompt(
        appendPrompt(
          sceneImagePrompt || videoPrompt || "Professional founder speaking directly to camera.",
          portraitPolish
        ),
        appendPrompt(appendPrompt(imageHardLock, talkingHeadIdentityLock), talkingHeadPodcastStyle)
      );

      const defaultScenePrompt = appendPrompt(
        appendPrompt(
          sceneImagePrompt || "Photorealistic UK dementia-care documentary scene.",
          portraitPolish
        ),
        imageHardLock
      );

      const sceneImageBody = {
        prompt: singleSceneTalkingHead ? talkingHeadScenePrompt : defaultScenePrompt,
        image_urls: pool,
        num_images: 1,
        seed: sceneSeed,
        aspect_ratio: "9:16",
        output_format: "png",
        resolution: "1K",
        safety_tolerance: "4",
        limit_generations: true,
      };

      let sceneImageUrl = "";
      let lastErr: any = null;
      for (const m of nanoModels) {
        try {
          console.log(`Scene ${i + 1}: using ${m.label} for start frame...`);
          const sceneImageSubmit = await falPostJson(m.url, sceneImageBody, falKey);
          sceneImageUrl = await resolveFalImageUrl(sceneImageSubmit, falKey, {
            pollIntervalMs,
            maxWaitMs,
            modelPath: m.modelPath,
          });
          break;
        } catch (e: any) {
          lastErr = e;
          throw e;
        }
      }
      if (!sceneImageUrl) {
        throw new Error(
          `Failed to generate scene start frame. Last error: ${String(lastErr?.message || lastErr).slice(
            0,
            260
          )}.`
        );
      }
      console.log(`Scene ${i + 1}: start frame ready: ${sceneImageUrl}`);

      // Talking-head mode: generate a single audio-conditioned presenter clip from the
      // synthesized/input narration instead of a static image hold.
      if (singleSceneTalkingHead) {
        let conditioningAudioUrl = clean(input.audioUrl);
        const tmpDir = "/tmp/remotion-render";
        fs.mkdirSync(tmpDir, { recursive: true });
        let localConditioningAudioPath = "";

        if (!looksLikeUrl(conditioningAudioUrl) && clean(input.narrationText)) {
          const talkingHeadAudioPath = path.join(
            tmpDir,
            `talking-head-${hashSeed(`${input.title}|${input.chatId}|${i}`)}.mp3`
          );
          await synthesizeVoiceoverElevenLabs(
            clean(input.narrationText),
            clean(input.voiceId) || "GoLTMzQJAHarswiHqv3L",
            talkingHeadAudioPath
          );
          localConditioningAudioPath = talkingHeadAudioPath;
        } else if (looksLikeUrl(conditioningAudioUrl)) {
          const sourceAudioPath = path.join(
            tmpDir,
            `talking-head-source-${hashSeed(`${conditioningAudioUrl}|${input.chatId}|${i}`)}.mp3`
          );
          await downloadToFile(conditioningAudioUrl, sourceAudioPath);
          localConditioningAudioPath = sourceAudioPath;
        }

        if (localConditioningAudioPath && fs.existsSync(localConditioningAudioPath)) {
          const fittedAudioPath = path.join(
            tmpDir,
            `talking-head-fitted-${hashSeed(`${localConditioningAudioPath}|${input.chatId}|${i}`)}.mp3`
          );
          const ltxReadyAudioPath = await fitAudioForLtx23(localConditioningAudioPath, fittedAudioPath);
          (input as any).__generatedAudioPath = ltxReadyAudioPath;
          const audioKey = `audio/${Date.now()}-${clean(input.title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "talking-head"}.mp3`;
          conditioningAudioUrl = await publishRenderedAudio(ltxReadyAudioPath, audioKey);
        }

        if (!looksLikeUrl(conditioningAudioUrl)) {
          throw new Error("Talking-head mode requires an audioUrl or narrationText to generate audio-conditioned video.");
        }

        const talkingHeadImage = await prepareTalkingHeadSourceImage(sceneImageUrl, input, i);
        // Legacy n8n payloads still send talkingHeadSingleImage=true for talking_head jobs.
        // Ignore that flag for live talking-head mode so the LTX path stays active.
        const keepStillTalkingHead =
          Boolean((input.renderConfig as any)?.talkingHeadSingleImage) &&
          clean(input.videoMode).toLowerCase() !== "talking_head";
        if (keepStillTalkingHead) {
          console.log(
            `Scene ${i + 1}: talking-head configured for still-image mode; skipping LTX clip generation.`
          );
          results[i] = talkingHeadImage.internalUrl || talkingHeadImage.publicUrl || sceneImageUrl;
          continue;
        }

        console.log(`Scene ${i + 1}/${scenes.length}: generating talking-head clip from audio...`);
        const talkingHeadSubmit = await falPostJson(
          ltxTalkingHeadUrl,
          {
            prompt: appendPrompt(
              videoPrompt || sceneImagePrompt || "A professional founder speaks directly to camera.",
              "Ultra-realistic direct-to-camera presenter. Natural skin texture with visible micro-texture and subsurface light scattering. " +
              "Subtle irregular blinking and natural microsaccades. Mouth movement precisely synced to speech phonemes. " +
              "Very slight natural head sway between sentences — not locked/frozen. " +
              "Chest-up vertical 9:16 framing, static camera, no zoom, no pan. " +
              "Shallow depth of field, natural bokeh in background, soft warm room lighting. " +
              "Preserve the exact face geometry, skin tone, hairline, beard pattern, and clothing from the reference image — no identity drift."
            ),
            audio_url: conditioningAudioUrl,
            image_url: talkingHeadImage.publicUrl || talkingHeadImage.internalUrl || sceneImageUrl,
            match_audio_length: true,
            video_size: "portrait_16_9",
            use_multiscale: true,
            fps: 25,
            video_quality: "high",
            video_write_mode: "balanced",
            num_inference_steps: 40,
            guidance_scale: 3,
            camera_lora: "static",
            audio_strength: 1,
            preprocess_audio: true,
            negative_prompt:
              "blurry, out of focus, overexposed, underexposed, low contrast, washed out colors, " +
              "excessive noise, grainy texture, poor lighting, flickering, motion blur, " +
              "distorted proportions, unnatural skin tones, deformed facial features, asymmetrical face, " +
              "missing facial features, extra limbs, disfigured hands, wrong hand count, " +
              "artifacts around text, inconsistent perspective, camera shake, incorrect depth of field, " +
              "background too sharp, background clutter, distracting reflections, harsh shadows, " +
              "inconsistent lighting direction, color banding, cartoonish rendering, 3D CGI look, " +
              "unrealistic materials, uncanny valley effect, incorrect ethnicity, wrong gender, " +
              "exaggerated expressions, wrong gaze direction, mismatched lip sync, " +
              "frozen face between words, no blinking, stiff expression, plastic skin, wax figure look, " +
              "identity drift, different person, changed ethnicity, changed hairline, changed beard, " +
              "jittery movement, awkward pauses, incorrect timing, unnatural transitions, " +
              "inconsistent framing, tilted camera, flat lighting, inconsistent tone, " +
              "cinematic oversaturation, stylized filters, AI artifacts, " +
              "letterboxing, black bars, borders, text, captions, logos, watermark, " +
              "full body, hands visible, waist visible, cropped head, extreme close-up",
          },
          falKey
        );
        const talkingHeadUrl = await resolveFalClipUrl(talkingHeadSubmit, falKey, {
          pollIntervalMs,
          maxWaitMs,
          modelPath: ltxTalkingHeadModelPath,
        });
        console.log(`Scene ${i + 1}: talking-head clip ready: ${talkingHeadUrl}`);
        results[i] = talkingHeadUrl;
        continue;
      }

      console.log(`Scene ${i + 1}/${scenes.length}: generating clip (${duration}s)...`);
      const klingBasePrompt = appendPrompt(
        videoPrompt || "Photorealistic UK dementia-care documentary scene.",
        videoHardLock
      );
      const klingMultiPrompt = buildKlingMultiPrompt(klingBasePrompt, duration);
      const clipSubmit = await falPostJson(
        klingUrl,
        klingMultiPrompt
          ? {
              start_image_url: sceneImageUrl,
              multi_prompt: klingMultiPrompt,
              shot_type: "customize",
              negative_prompt: videoNegativePrompt,
              aspect_ratio: "9:16",
              duration: String(duration),
              generate_audio: false,
            }
          : {
              start_image_url: sceneImageUrl,
              prompt: klingBasePrompt,
              negative_prompt: videoNegativePrompt,
              aspect_ratio: "9:16",
              duration: String(duration),
              generate_audio: false,
            },
        falKey
      );

      const clipUrl = await resolveFalClipUrl(clipSubmit, falKey, {
        pollIntervalMs,
        maxWaitMs,
        modelPath: klingModelPath,
      });
      console.log(`Scene ${i + 1}: clip ready: ${clipUrl}`);
      results[i] = clipUrl;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, scenes.length) }, () => worker()));
  const done = results.filter((u) =>
    singleSceneTalkingHead ? (looksLikeImageUrl(u) || looksLikeVideoUrl(u)) : looksLikeVideoUrl(u)
  );
  if (done.length !== scenes.length) {
    throw new Error(`Only generated ${done.length}/${scenes.length} clips`);
  }
  return results;
}

async function downloadToFile(url: string, destPath: string): Promise<string> {
  const effectiveUrl = rewriteToInternalPublicAssetUrl(url);
  console.log(
    `Downloading: ${url}${effectiveUrl !== url ? ` (via ${effectiveUrl})` : ""} -> ${destPath}`
  );
  const response = await fetch(effectiveUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${effectiveUrl}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  console.log(`Downloaded: ${destPath} (${buffer.length} bytes)`);
  return destPath;
}

function collectSetCookieHeaders(response: Response): string[] {
  const headersAny = response.headers as any;
  if (typeof headersAny?.getSetCookie === "function") {
    const values = headersAny.getSetCookie();
    if (Array.isArray(values)) return values;
  }
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function mergeCookieJar(jar: Map<string, string>, response: Response): void {
  for (const rawCookie of collectSetCookieHeaders(response)) {
    const firstPart = String(rawCookie || "").split(";")[0] || "";
    const eqIndex = firstPart.indexOf("=");
    if (eqIndex <= 0) continue;
    const name = firstPart.slice(0, eqIndex).trim();
    const value = firstPart.slice(eqIndex + 1).trim();
    if (!name) continue;
    jar.set(name, value);
  }
}

function buildCookieHeader(jar: Map<string, string>): string {
  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function fetchWithCookieJar(
  url: string,
  init: RequestInit,
  jar: Map<string, string>
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const cookieHeader = buildCookieHeader(jar);
  if (cookieHeader) headers.set("cookie", cookieHeader);
  const response = await fetch(url, { ...init, headers });
  mergeCookieJar(jar, response);
  return response;
}

function extractZoomShareMeetingId(html: string): string {
  const match = String(html || "").match(
    /(?:window\.recordingMobilePlayData|window\.__data__)\s*=\s*\{[\s\S]*?meetingId:\s*'([^']+)'/i
  );
  return clean(match?.[1] || "");
}

async function downloadWithCookieJarToFile(
  url: string,
  destPath: string,
  jar: Map<string, string>,
  baseHeaders: Record<string, string>,
  referer = ""
): Promise<string> {
  const response = await fetchWithCookieJar(
    url,
    {
      method: "GET",
      headers: {
        ...baseHeaders,
        accept: "video/mp4,application/octet-stream,*/*;q=0.8",
        ...(referer ? { referer } : {}),
      },
    },
    jar
  );
  if (!response.ok) {
    throw new Error(`Failed to download Zoom media: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    throw new Error("Zoom media download returned an empty file.");
  }
  fs.writeFileSync(destPath, buffer);
  console.log(`Downloaded Zoom recording: ${destPath} (${buffer.length} bytes)`);
  return destPath;
}

function firstHttpUrl(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = clean(value);
    return /^https?:\/\//i.test(trimmed) ? trimmed : "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstHttpUrl(item);
      if (found) return found;
    }
    return "";
  }
  if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      const found = firstHttpUrl(entry);
      if (found) return found;
    }
  }
  return "";
}

async function downloadZoomShareRecordingToFile(
  shareUrl: string,
  passcode: string,
  destPath: string
): Promise<string> {
  const cleanedShareUrl = clean(shareUrl);
  const cleanedPasscode = clean(passcode);
  if (!cleanedPasscode) {
    throw new Error("This Zoom recording requires a passcode.");
  }

  const share = new URL(cleanedShareUrl);
  const origin = `${share.protocol}//${share.host}`;
  const jar = new Map<string, string>();
  const baseHeaders = {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "accept-language": "en-US,en;q=0.9",
  };

  const shareResponse = await fetchWithCookieJar(
    cleanedShareUrl,
    {
      method: "GET",
      headers: {
        ...baseHeaders,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    },
    jar
  );
  if (!shareResponse.ok) {
    throw new Error(`Failed to open Zoom share page: ${shareResponse.status}`);
  }

  const shareHtml = await shareResponse.text();
  const meetingId = extractZoomShareMeetingId(shareHtml);
  if (!meetingId) {
    throw new Error("Could not resolve the Zoom recording meeting id.");
  }

  const validateContextResponse = await fetchWithCookieJar(
    `${origin}/nws/recording/1.0/validate-context`,
    {
      method: "POST",
      headers: {
        ...baseHeaders,
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        origin,
        referer: cleanedShareUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: new URLSearchParams({
        meetingId,
        fileId: "",
        useWhichPasswd: "meeting",
        sharelevel: "meeting",
        iet: jar.get("iet") || "",
      }).toString(),
    },
    jar
  );
  const validateContextJson = await validateContextResponse.json().catch(() => null);
  const contextResult = validateContextJson?.result || {};
  const encryptMeetId = clean(contextResult?.encryptMeetId);
  const fileId = clean(contextResult?.fileId);
  const useWhichPasswd = clean(contextResult?.useWhichPasswd || "meeting");
  const shareLevel = clean(contextResult?.sharelevel || "meeting");
  if (!encryptMeetId && !fileId) {
    throw new Error(
      `Zoom validate-context did not return a usable recording id: ${clean(
        validateContextJson?.errorMessage
      ) || "unknown error"}`
    );
  }

  const passwordEndpoint =
    useWhichPasswd === "meeting"
      ? `${origin}/nws/recording/1.0/validate-meeting-passwd`
      : `${origin}/nws/recording/1.0/validate-passwd`;
  const passwordId = useWhichPasswd === "meeting" ? encryptMeetId : fileId;
  const passwordResponse = await fetchWithCookieJar(
    passwordEndpoint,
    {
      method: "POST",
      headers: {
        ...baseHeaders,
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        origin,
        referer: cleanedShareUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: new URLSearchParams({
        id: passwordId,
        passwd: cleanedPasscode,
        action: "download",
        recaptcha: "",
      }).toString(),
    },
    jar
  );
  const passwordJson = await passwordResponse.json().catch(() => null);
  const passwordResult = clean(passwordJson?.result);
  if (passwordResult !== "download") {
    throw new Error(
      `Zoom passcode validation failed: ${clean(passwordJson?.errorMessage) || passwordResult || "unknown error"}`
    );
  }

  const directDownloadPath =
    shareLevel === "meeting"
      ? `${origin}/rec/download_meeting/${encodeURIComponent(encryptMeetId)}?rnd=${Date.now()}`
      : `${origin}/rec/sdownload/${encodeURIComponent(fileId)}?rnd=${Date.now()}`;
  const downloadResponse = await fetchWithCookieJar(
    directDownloadPath,
    {
      method: "GET",
      headers: {
        ...baseHeaders,
        accept: "application/json, text/plain, */*",
        origin,
        referer: cleanedShareUrl,
      },
    },
    jar
  );
  if (!downloadResponse.ok) {
    throw new Error(`Failed to resolve Zoom recording download: ${downloadResponse.status}`);
  }

  const contentType = clean(downloadResponse.headers.get("content-type")).toLowerCase();
  if (contentType.includes("application/json")) {
    const downloadJson = await downloadResponse.json().catch(() => null);
    const signedUrl = firstHttpUrl(downloadJson?.result || downloadJson);
    if (!signedUrl) {
      throw new Error("Zoom download response did not include a downloadable media URL.");
    }
    return await downloadWithCookieJarToFile(signedUrl, destPath, jar, baseHeaders, cleanedShareUrl);
  }

  const buffer = Buffer.from(await downloadResponse.arrayBuffer());
  if (!buffer.length) {
    throw new Error("Zoom recording download returned an empty file.");
  }
  fs.writeFileSync(destPath, buffer);
  console.log(`Downloaded Zoom recording: ${destPath} (${buffer.length} bytes)`);
  return destPath;
}

function inferPathExtFromUrl(url: string, fallback = ".bin"): string {
  try {
    const pathname = new URL(url).pathname || "";
    const ext = path.extname(pathname).toLowerCase();
    return ext || fallback;
  } catch {
    return fallback;
  }
}

async function prepareTalkingHeadSourceImage(
  sceneImageUrl: string,
  input: RenderInput,
  sceneIndex: number
): Promise<{ publicUrl: string; internalUrl: string }> {
  const sourceUrl = clean(sceneImageUrl);
  if (!looksLikeUrl(sourceUrl)) {
    return { publicUrl: sourceUrl, internalUrl: sourceUrl };
  }

  const tmpDir = "/tmp/remotion-render";
  fs.mkdirSync(tmpDir, { recursive: true });

  const sourceExt = inferPathExtFromUrl(sourceUrl, ".png");
  const sourcePath = path.join(
    tmpDir,
    `talking-head-source-image-${hashSeed(`${sourceUrl}|${input.chatId}|${sceneIndex}`)}${sourceExt}`
  );
  await downloadToFile(sourceUrl, sourcePath);

  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) {
    return { publicUrl: sourceUrl, internalUrl: sourceUrl };
  }

  const paddedPath = path.join(
    tmpDir,
    `talking-head-padded-${hashSeed(`${sourcePath}|${input.title}|${sceneIndex}`)}.png`
  );

  // Fill the portrait frame with a top-biased crop so LTX sees a tighter
  // talking-head reference instead of inheriting full-body composition.
  const filter = [
    "color=c=#ece7df:s=1080x1920[bg]",
    "[0:v]scale=1180:2060:force_original_aspect_ratio=increase[fg]",
    "[bg][fg]overlay=(W-w)/2:(H-h)/2-170,format=rgb24[out]",
  ].join(";");

  const res = await runCmd("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    sourcePath,
    "-filter_complex",
    filter,
    "-map",
    "[out]",
    "-frames:v",
    "1",
    paddedPath,
  ]);

  if (res.code !== 0 || !fs.existsSync(paddedPath)) {
    console.log(
      `Talking-head source padding failed; using original still. ${String(res.stderr || "").slice(0, 220)}`
    );
    return { publicUrl: sourceUrl, internalUrl: sourceUrl };
  }

  const imageKey = `images/${Date.now()}-${clean(input.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "talking-head-source"}.png`;
  return {
    publicUrl: publishToLocalPublicDir(paddedPath, imageKey),
    internalUrl: buildInternalPublicAssetUrl(imageKey),
  };
}

async function getAudioDuration(filePath: string): Promise<number> {
  // Prefer real metadata duration; fallback to a rough estimate if parsing fails.
  try {
    const metadata = await parseFile(filePath, { duration: true });
    const dur = Number(metadata?.format?.duration);
    if (Number.isFinite(dur) && dur > 0) {
      console.log(`Audio duration (metadata): ${dur.toFixed(2)}s`);
      return dur;
    }
  } catch (e) {
    console.log(
      `Audio duration parse failed, falling back to estimate: ${String(
        (e as any)?.message || e
      ).slice(0, 180)}`
    );
  }

  // Estimate duration from file size for MP3 at 128kbps
  const stats = fs.statSync(filePath);
  const fileSizeBytes = stats.size;
  const bitrateKbps = 128;
  const durationSec = (fileSizeBytes * 8) / (bitrateKbps * 1000);
  console.log(
    `Audio duration (estimated): ${durationSec.toFixed(1)}s (${fileSizeBytes} bytes at ${bitrateKbps}kbps)`
  );
  return durationSec;
}

function fileToDataUri(filePath: string, mimeType: string): string {
  const buffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function fitAudioForLtx23(inputPath: string, outputPath: string): Promise<string> {
  const minSeconds = 2;
  const maxSeconds = 20;
  const duration = await getAudioDuration(inputPath);

  if (duration >= minSeconds && duration <= maxSeconds) {
    return inputPath;
  }

  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) {
    console.log("ffmpeg not found; skipping LTX 2.3 audio fitting.");
    return inputPath;
  }

  function buildAtempoFilter(speed: number): string {
    let remaining = Math.max(0.01, speed);
    const parts: string[] = [];
    while (remaining > 2.0) {
      parts.push("atempo=2.0");
      remaining = remaining / 2.0;
    }
    while (remaining < 0.5) {
      parts.push("atempo=0.5");
      remaining = remaining / 0.5;
    }
    parts.push(`atempo=${remaining.toFixed(3)}`);
    return parts.join(",");
  }

  let args: string[] = [];
  if (duration > maxSeconds) {
    const speed = duration / maxSeconds;
    const atempo = buildAtempoFilter(speed);
    console.log(
      `LTX 2.3 audio is ${duration.toFixed(2)}s; speeding up by ${speed.toFixed(
        3
      )}x to fit ${maxSeconds}s max without cutting words.`
    );
    args = [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-af",
      `${atempo},aresample=async=1:min_hard_comp=0.100:first_pts=0`,
      "-vn",
      "-c:a",
      "libmp3lame",
      "-q:a",
      "2",
      outputPath,
    ];
  } else {
    console.log(`LTX 2.3 audio is ${duration.toFixed(2)}s; padding to ${minSeconds}s min.`);
    args = [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-af",
      "apad",
      "-t",
      String(minSeconds),
      "-vn",
      "-c:a",
      "libmp3lame",
      "-q:a",
      "2",
      outputPath,
    ];
  }

  const res = await runCmd("ffmpeg", args);
  if (res.code !== 0 || !fs.existsSync(outputPath)) {
    console.log(
      `LTX 2.3 audio fitting failed; using original audio. ${String(res.stderr || "").slice(0, 220)}`
    );
    return inputPath;
  }

  return outputPath;
}

async function speedAdjustAudio(
  inputPath: string,
  outputPath: string,
  speed: number
): Promise<string> {
  const normalizedSpeed = Number(speed);
  if (!Number.isFinite(normalizedSpeed) || Math.abs(normalizedSpeed - 1) < 0.01) {
    return inputPath;
  }

  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) {
    console.log("ffmpeg not found; skipping audio pacing adjustment.");
    return inputPath;
  }

  const res = await runCmd("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    inputPath,
    "-filter:a",
    `atempo=${normalizedSpeed.toFixed(2)}`,
    "-vn",
    outputPath,
  ]);

  if (res.code !== 0 || !fs.existsSync(outputPath)) {
    console.log(
      `Audio pacing adjustment failed; keeping original voiceover. ${String(res.stderr || "").slice(0, 220)}`
    );
    return inputPath;
  }

  return outputPath;
}

function splitNarrationByLockedBrandWord(text: string): Array<{ kind: "tts" | "brand"; text: string }> {
  const src = String(text || "");
  const parts: Array<{ kind: "tts" | "brand"; text: string }> = [];
  const re = /\bDignitate\b/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    const before = src.slice(last, start);
    if (before) parts.push({ kind: "tts", text: before });
    parts.push({ kind: "brand", text: m[0] });
    last = end;
  }
  const tail = src.slice(last);
  if (tail) parts.push({ kind: "tts", text: tail });
  return parts;
}

function isSpeakableText(text: string): boolean {
  return /[A-Za-z0-9]/.test(String(text || ""));
}

async function synthesizeElevenSegment(
  text: string,
  url: string,
  apiKey: string,
  destPath: string
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_v3",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS failed (${response.status}): ${body.slice(0, 200)}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  return destPath;
}

async function trimAudioSegmentBoundarySilence(inputPath: string): Promise<string> {
  if (!inputPath || !fs.existsSync(inputPath)) {
    return inputPath;
  }

  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) {
    return inputPath;
  }

  const outPath = inputPath.replace(/(\.[^.]+)?$/i, ".trimmed$1");
  const filter =
    "silenceremove=start_periods=1:start_duration=0.04:start_threshold=-42dB," +
    "areverse," +
    "silenceremove=start_periods=1:start_duration=0.06:start_threshold=-42dB," +
    "areverse";

  const res = await runCmd("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    inputPath,
    "-af",
    filter,
    "-c:a",
    "libmp3lame",
    "-q:a",
    "2",
    outPath,
  ]);

  if (res.code !== 0 || !fs.existsSync(outPath)) {
    console.log(
      `Boundary silence trim failed for ${path.basename(inputPath)}; keeping original. ${String(
        res.stderr || ""
      ).slice(0, 200)}`
    );
    return inputPath;
  }

  return outPath;
}

async function concatAudioSegments(segmentPaths: string[], outPath: string): Promise<string> {
  const valid = (segmentPaths || []).filter((p) => p && fs.existsSync(p));
  if (!valid.length) {
    throw new Error("No audio segments available to concat.");
  }
  if (valid.length === 1) {
    fs.copyFileSync(valid[0], outPath);
    return outPath;
  }

  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) {
    throw new Error("ffmpeg is required to concatenate segmented TTS audio.");
  }

  const prepared: string[] = [];
  for (const segmentPath of valid) {
    prepared.push(await trimAudioSegmentBoundarySilence(segmentPath));
  }

  const args: string[] = ["-y", "-hide_banner", "-loglevel", "error"];
  prepared.forEach((p) => {
    args.push("-i", p);
  });
  const labels = prepared.map((_, i) => `[${i}:a]`).join("");
  const filter = `${labels}concat=n=${prepared.length}:v=0:a=1[a]`;
  args.push("-filter_complex", filter, "-map", "[a]", "-c:a", "libmp3lame", "-q:a", "2", outPath);

  const res = await runCmd("ffmpeg", args);
  if (res.code !== 0 || !fs.existsSync(outPath)) {
    throw new Error(
      `Failed to concatenate locked brand audio segments. ${String(res.stderr || "").slice(0, 240)}`
    );
  }

  return outPath;
}

async function synthesizeVoiceoverElevenLabs(
  text: string,
  voiceId: string,
  destPath: string
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing");
  }

  const cleanedText = normalizeSpeechText(String(text || "").trim());
  if (!cleanedText) {
    throw new Error("Narration text is empty");
  }

  // Locked production profile: keep this voice ID stable so pronunciation stays consistent.
  const lockedVoiceId = String(process.env.ELEVEN_LOCKED_VOICE_ID || "GoLTMzQJAHarswiHqv3L").trim();
  const lockProfile = String(process.env.ELEVEN_LOCK_PROFILE || "1").trim() !== "0";
  const resolvedVoiceId = lockProfile
    ? lockedVoiceId
    : String(voiceId || lockedVoiceId).trim();
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(resolvedVoiceId)}`;
  const lockBrandWordAudio = String(process.env.ELEVEN_LOCK_BRAND_WORD_AUDIO || "0").trim() !== "0";
  const lockedBrandWordPath = String(
    process.env.ELEVEN_LOCKED_BRAND_WORD_PATH || path.resolve(process.cwd(), "assets", "dignitate-word.mp3")
  ).trim();
  const hasBrandWord = /\bDignitate\b/i.test(cleanedText);

  console.log(`Generating voiceover with ElevenLabs voice ${resolvedVoiceId}...`);
  if (lockBrandWordAudio && hasBrandWord && fs.existsSync(lockedBrandWordPath)) {
    console.log(`Using locked brand-word audio splice: ${lockedBrandWordPath}`);
    const parts = splitNarrationByLockedBrandWord(cleanedText);
    const tmpAudioDir = path.join(path.dirname(destPath), "tts-segments");
    fs.mkdirSync(tmpAudioDir, { recursive: true });
    const segmentPaths: string[] = [];
    let ttsIdx = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.kind === "brand") {
        segmentPaths.push(lockedBrandWordPath);
        continue;
      }
      if (!isSpeakableText(part.text)) {
        continue;
      }
      const segPath = path.join(
        tmpAudioDir,
        `seg-${String(ttsIdx + 1).padStart(2, "0")}-${hashSeed(part.text).toString(36)}.mp3`
      );
      await synthesizeElevenSegment(part.text.trim(), url, apiKey, segPath);
      segmentPaths.push(segPath);
      ttsIdx += 1;
    }

    if (segmentPaths.length === 0) {
      throw new Error("No segments produced while building locked brand-word voiceover.");
    }
    await concatAudioSegments(segmentPaths, destPath);
  } else {
    await synthesizeElevenSegment(cleanedText, url, apiKey, destPath);
  }

  const paceSpeed = Number(process.env.ELEVEN_PACE_SPEED || "1");
  if (Number.isFinite(paceSpeed) && paceSpeed > 1.01) {
    const pacedPath = destPath.replace(/(\.[^.]+)?$/i, ".paced$1");
    const finalPath = await speedAdjustAudio(destPath, pacedPath, paceSpeed);
    if (finalPath !== destPath) {
      fs.copyFileSync(finalPath, destPath);
    }
  }
  const finalSize = fs.statSync(destPath).size;
  console.log(`Voiceover generated: ${destPath} (${finalSize} bytes)`);
  return destPath;
}

function buildPublicAssetUrl(key: string): string {
  const publicBaseUrl = String(process.env.PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
  const resolvedBaseUrl =
    publicBaseUrl || `http://127.0.0.1:${Number(process.env.PORT || 3001)}`;
  const objectPath = String(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${resolvedBaseUrl}/public/${objectPath}`;
}

function buildInternalPublicAssetUrl(key: string): string {
  const baseUrl = `http://127.0.0.1:${Number(process.env.PORT || 3001)}`;
  const objectPath = String(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${baseUrl}/public/${objectPath}`;
}

function rewriteToInternalPublicAssetUrl(url: string): string {
  const sourceUrl = clean(url);
  if (!looksLikeUrl(sourceUrl)) return sourceUrl;

  const publicBaseUrl = String(process.env.PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!publicBaseUrl) return sourceUrl;

  const prefix = `${publicBaseUrl}/public/`;
  if (!sourceUrl.startsWith(prefix)) return sourceUrl;

  const internalBaseUrl = `http://127.0.0.1:${Number(process.env.PORT || 3001)}`;
  return `${internalBaseUrl}${sourceUrl.slice(publicBaseUrl.length)}`;
}

function publishToLocalPublicDir(filePath: string, key: string): string {
  const publicRoot = path.join("/tmp", "remotion-render", "public");
  const destPath = path.join(publicRoot, ...String(key).split("/"));
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(filePath, destPath);
  const publicUrl = buildPublicAssetUrl(key);
  console.log(`Published locally: ${publicUrl}`);
  return publicUrl;
}

async function publishRenderedVideo(
  filePath: string,
  key: string
): Promise<string> {
  return publishRenderedAsset(filePath, key, "video/mp4");
}

async function publishRenderedAudio(
  filePath: string,
  key: string
): Promise<string> {
  return publishRenderedAsset(filePath, key, "audio/mpeg");
}

async function publishRenderedAsset(
  filePath: string,
  key: string,
  contentType: string
): Promise<string> {
  void contentType;
  // Persist on the VPS bind mount served by the render service instead of
  // sending generated assets to Supabase.
  return publishToLocalPublicDir(filePath, key);
}

async function reframeLandscapeClipToVertical(
  inputPath: string,
  outputPath: string
): Promise<string> {
  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) {
    return inputPath;
  }

  const filter = [
    "[0:v]split=2[bg][fg]",
    "[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=22[bgv]",
    "[fg]scale=1080:1920:force_original_aspect_ratio=decrease[fgv]",
    "[bgv][fgv]overlay=(W-w)/2:(H-h)/2[v]",
  ].join(";");

  const res = await runCmd("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    inputPath,
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-map",
    "0:a?",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);

  if (res.code !== 0 || !fs.existsSync(outputPath)) {
    console.log(
      `Landscape-to-vertical reframing failed; keeping original clip. ${String(res.stderr || "").slice(0, 220)}`
    );
    return inputPath;
  }

  return outputPath;
}

async function stageClipUrlsLocally(
  clipUrls: string[],
  tmpDir: string
): Promise<string[]> {
  const urls = (clipUrls || []).map((u) => clean(u)).filter((u) => looksLikeUrl(u));
  if (!urls.length) return [];

  const stagedUrls: string[] = [];
  const stageBatchId = `${Date.now()}-${hashSeed(urls.join("|")).toString(36)}`;

  for (let i = 0; i < urls.length; i++) {
    const src = urls[i];
    let ext = ".mp4";
    try {
      const pathname = new URL(src).pathname || "";
      const candidateExt = path.extname(pathname).toLowerCase();
      if (candidateExt) ext = candidateExt;
    } catch {
      // fall back to mp4
    }

    const key = `staged-clips/${stageBatchId}/clip-${String(i + 1).padStart(2, "0")}${ext}`;
    const destPath = path.join(tmpDir, "public", ...key.split("/"));
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    await downloadToFile(src, destPath);

    let finalPath = destPath;
    if (ext === ".mp4" || ext === ".mov" || ext === ".webm") {
      const probe = await probeVideo(destPath);
      if (probe.width > probe.height) {
        console.log(
          `Stage clip ${i + 1}: source is landscape (${probe.width}x${probe.height}); reframing to 1080x1920.`
        );
        const reframedPath = destPath.replace(/(\.[^.]+)?$/i, "-vertical.mp4");
        finalPath = await reframeLandscapeClipToVertical(destPath, reframedPath);
      }
    }

    const finalKey =
      finalPath === destPath
        ? key
        : key.replace(/\.[^.]+$/i, "-vertical.mp4");
    if (finalPath !== destPath) {
      const publishedPath = path.join(tmpDir, "public", ...finalKey.split("/"));
      fs.mkdirSync(path.dirname(publishedPath), { recursive: true });
      fs.copyFileSync(finalPath, publishedPath);
    }

    stagedUrls.push(buildInternalPublicAssetUrl(finalKey));
  }

  console.log(`Staged ${stagedUrls.length} clip(s) locally for Remotion rendering.`);
  return stagedUrls;
}

function publishLocalAssetWithInternal(
  filePath: string,
  key: string
): { publicUrl: string; internalUrl: string } {
  return {
    publicUrl: publishToLocalPublicDir(filePath, key),
    internalUrl: buildInternalPublicAssetUrl(key),
  };
}

async function transcribeAudioWithWhisper(
  audioUrl: string,
  falKey: string,
  opts: {
    chunkLevel: "segment" | "word";
    diarize?: boolean;
    language?: string;
    prompt?: string;
  }
): Promise<any> {
  const submit = await falPostJson(
    "https://queue.fal.run/fal-ai/whisper",
    {
      audio_url: audioUrl,
      task: "transcribe",
      chunk_level: opts.chunkLevel,
      version: "3",
      diarize: Boolean(opts.diarize),
      language: clean(opts.language) || undefined,
      prompt: clean(opts.prompt) || undefined,
    },
    falKey
  );

  return await resolveFalResultJson(submit, falKey, {
    pollIntervalMs: 4000,
    maxWaitMs: 30 * 60 * 1000,
    modelPath: "fal-ai/whisper",
  });
}

async function cutMeetingClip(
  sourcePath: string,
  startSec: number,
  endSec: number,
  outputPath: string
): Promise<string> {
  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) {
    throw new Error("ffmpeg is required to cut meeting highlights.");
  }

  const start = Math.max(0, startSec);
  const duration = Math.max(1, endSec - startSec);
  const res = await runCmd("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    start.toFixed(3),
    "-i",
    sourcePath,
    "-t",
    duration.toFixed(3),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);

  if (res.code !== 0 || !fs.existsSync(outputPath)) {
    throw new Error(`Failed to cut meeting clip: ${String(res.stderr || "").slice(0, 220)}`);
  }

  const probe = await probeVideo(outputPath);
  if (probe.width > probe.height) {
    const verticalPath = outputPath.replace(/(\.[^.]+)?$/i, "-vertical.mp4");
    return await reframeLandscapeClipToVertical(outputPath, verticalPath);
  }

  return outputPath;
}

async function prepareMeetingReels(
  input: RenderInput,
  falKey: string,
  tmpDir: string
): Promise<RenderJob[]> {
  const sourceVideoUrl = clean(input.sourceVideoUrl);
  if (!looksLikeUrl(sourceVideoUrl)) {
    throw new Error("meeting_reels mode requires a sourceVideoUrl.");
  }

  const meetingConfig = normalizeMeetingConfig(input);
  const meetingPasscode = clean(
    (input.meetingConfig && typeof input.meetingConfig === "object"
      ? (input.meetingConfig as any)?.passcode
      : "") || (meetingConfig as any)?.passcode
  );
  const sourceVideoPath = path.join(
    tmpDir,
    `meeting-source-${hashSeed(`${sourceVideoUrl}|${input.chatId}|${input.title}`)}${
      isZoomRecordingShareUrl(sourceVideoUrl) ? ".mp4" : inferPathExtFromUrl(sourceVideoUrl, ".mp4")
    }`
  );
  if (isZoomRecordingShareUrl(sourceVideoUrl)) {
    await downloadZoomShareRecordingToFile(sourceVideoUrl, meetingPasscode, sourceVideoPath);
  } else {
    await downloadToFile(sourceVideoUrl, sourceVideoPath);
  }

  const fullAudioPath = path.join(
    tmpDir,
    `meeting-source-${hashSeed(`${sourceVideoUrl}|audio`)}.mp3`
  );
  await extractAudioFromVideo(sourceVideoPath, fullAudioPath);
  const meetingAudioAsset = publishLocalAssetWithInternal(
    fullAudioPath,
    `audio/${Date.now()}-${slugify(input.title, "meeting-source")}-full.mp3`
  );

  const fullTranscript = await transcribeAudioWithWhisper(meetingAudioAsset.publicUrl, falKey, {
    chunkLevel: "segment",
    diarize: true,
    language: meetingConfig.language,
    prompt: meetingConfig.transcriptionPrompt,
  });
  const transcriptChunks = normalizeTranscriptChunks(fullTranscript);
  if (!transcriptChunks.length) {
    throw new Error("Meeting transcription returned no timestamped chunks.");
  }

  const manualHighlights = (Array.isArray(input.scenes) ? input.scenes : [])
    .map((scene, index) => {
      const startSec = Number((scene as any)?.startSec);
      const endSec = Number((scene as any)?.endSec);
      if (!Number.isFinite(startSec) || !Number.isFinite(endSec) || endSec <= startSec) return null;
      const clipChunks = transcriptChunks.filter(
        (chunk) => chunk.endSec > startSec && chunk.startSec < endSec
      );
      const text =
        cleanTranscriptText((scene as any)?.narration) ||
        cleanTranscriptText(clipChunks.map((chunk) => chunk.text).join(" "));
      const manualTitle = clean((scene as any)?.title);
      return {
        title: manualTitle || buildMeetingSceneTitle(input.title, index, text),
        startSec,
        endSec,
        durationSec: endSec - startSec,
        text,
        speaker: undefined,
        score: 0,
      } as MeetingHighlight;
    })
    .filter(Boolean) as MeetingHighlight[];

  const highlights = manualHighlights.length
    ? manualHighlights
    : pickMeetingHighlights(transcriptChunks, meetingConfig, input.title);

  if (!highlights.length) {
    throw new Error("Could not identify any suitable highlights from the meeting transcript.");
  }

  const jobs: RenderJob[] = [];

  for (let index = 0; index < highlights.length; index++) {
    const highlight = highlights[index];
    const paddedStart = Math.max(0, highlight.startSec - 0.4);
    const paddedEnd = highlight.endSec + 0.35;
    const clipPath = path.join(
      tmpDir,
      `meeting-clip-${String(index + 1).padStart(2, "0")}-${hashSeed(`${highlight.startSec}|${highlight.endSec}|${input.title}`)}.mp4`
    );
    const finalClipPath = await cutMeetingClip(sourceVideoPath, paddedStart, paddedEnd, clipPath);
    const clipAsset = publishLocalAssetWithInternal(
      finalClipPath,
      `videos/${Date.now()}-${slugify(input.title, "meeting")}-source-clip-${String(index + 1).padStart(2, "0")}.mp4`
    );

    const clipAudioPath = path.join(
      tmpDir,
      `meeting-clip-audio-${String(index + 1).padStart(2, "0")}-${hashSeed(finalClipPath)}.mp3`
    );
    await extractAudioFromVideo(finalClipPath, clipAudioPath);
    const clipAudioAsset = publishLocalAssetWithInternal(
      clipAudioPath,
      `audio/${Date.now()}-${slugify(input.title, "meeting")}-clip-${String(index + 1).padStart(2, "0")}.mp3`
    );

    const clipTranscript = await transcribeAudioWithWhisper(clipAudioAsset.publicUrl, falKey, {
      chunkLevel: "word",
      diarize: false,
      language: meetingConfig.language,
      prompt: meetingConfig.transcriptionPrompt,
    });

    const timedWords = normalizeTranscriptWords(clipTranscript);
    const clipDurationSec = Math.max(1, paddedEnd - paddedStart);
    const fallbackWords =
      timedWords.length > 0
        ? timedWords
        : transcriptChunks
            .filter((chunk) => chunk.endSec > paddedStart && chunk.startSec < paddedEnd)
            .flatMap((chunk) => {
              const shiftedStart = Math.max(0, chunk.startSec - paddedStart);
              const shiftedEnd = Math.max(shiftedStart + 0.08, chunk.endSec - paddedStart);
              return estimateWordsWithinChunk({
                ...chunk,
                startSec: shiftedStart,
                endSec: shiftedEnd,
              });
            });

    jobs.push({
      title: highlight.title,
      description: buildMeetingSceneDescription(highlight.text),
      chatId: input.chatId,
      clipUrls: [clipAsset.internalUrl],
      scenes: [
        {
          narration: highlight.text,
          visualPrompt: "Meeting highlight reel extracted from source recording.",
          type: "hook",
          duration: clipDurationSec,
          index: 0,
          startSec: paddedStart,
          endSec: paddedEnd,
          timedWords: fallbackWords.map((word) => ({
            word: word.word,
            startSec: Math.max(0, word.startSec),
            endSec: Math.max(word.startSec + 0.06, word.endSec),
          })),
        },
      ],
      includeClipAudio: meetingConfig.preserveSourceAudio,
    });
  }

  return jobs;
}

function resolveN8nWebhookUrl(input: RenderInput | null): string {
  // Prefer the payload callback URL, then fall back to env.
  // This prevents stale env configuration from overriding the workflow-dispatched URL.
  const fromPayload = String(input?.n8nWebhookUrl ?? "").trim();
  if (fromPayload) return fromPayload;
  const env = String(process.env.N8N_WEBHOOK_URL ?? "").trim();
  return env;
}

function commandExists(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn("bash", ["-lc", `command -v ${cmd} >/dev/null 2>&1`], {
      stdio: "ignore",
    });
    p.on("close", (code) => resolve(code === 0));
    p.on("error", () => resolve(false));
  });
}

async function runCmd(
  cmd: string,
  args: string[],
  opts: { cwd?: string } = {}
): Promise<{ code: number; stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      cwd: opts.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d.toString("utf8")));
    p.stderr.on("data", (d) => (stderr += d.toString("utf8")));
    p.on("error", reject);
    p.on("close", (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

async function probeVideo(filePath: string): Promise<{
  width: number;
  height: number;
  sar: string;
  dar: string;
  rotate: number;
}> {
  const ffprobeOk = await commandExists("ffprobe");
  if (!ffprobeOk) {
    return { width: 0, height: 0, sar: "", dar: "", rotate: 0 };
  }

  const res = await runCmd("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,sample_aspect_ratio,display_aspect_ratio:stream_tags=rotate",
    "-of",
    "json",
    filePath,
  ]);
  if (res.code !== 0) {
    return { width: 0, height: 0, sar: "", dar: "", rotate: 0 };
  }

  try {
    const j = JSON.parse(res.stdout || "{}");
    const s = (j.streams && j.streams[0]) || {};
    const width = Number(s.width || 0);
    const height = Number(s.height || 0);
    const sar = clean(s.sample_aspect_ratio || "");
    const dar = clean(s.display_aspect_ratio || "");
    const rotate = Number((s.tags && s.tags.rotate) || 0) || 0;
    return { width, height, sar, dar, rotate };
  } catch {
    return { width: 0, height: 0, sar: "", dar: "", rotate: 0 };
  }
}

function parseCropFromCropdetect(stderr: string): string {
  const s = String(stderr || "");
  // ffmpeg prints many crop=... values; the last is usually the most stable.
  const matches = [...s.matchAll(/crop=(\d+:\d+:\d+:\d+)/g)];
  const last = matches.length ? matches[matches.length - 1][1] : "";
  return clean(last);
}

function parseCrop(crop: string): { w: number; h: number; x: number; y: number } | null {
  const m = clean(crop).match(/^(\d+):(\d+):(\d+):(\d+)$/);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  const x = Number(m[3]);
  const y = Number(m[4]);
  if (![w, h, x, y].every((n) => Number.isFinite(n) && n >= 0)) return null;
  return { w, h, x, y };
}

async function detectCrop(filePath: string): Promise<string> {
  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) return "";

  // Sample a few seconds early in the file to detect black bars reliably.
  const res = await runCmd("ffmpeg", [
    "-hide_banner",
    "-ss",
    "0.25",
    "-t",
    "2.5",
    "-i",
    filePath,
    "-vf",
    "cropdetect=24:16:0",
    "-an",
    "-f",
    "null",
    "-",
  ]);
  const crop = parseCropFromCropdetect(res.stderr);
  return crop;
}

async function normalizeOutputVideo(
  inputPath: string,
  outPath: string,
  tmpDir: string
): Promise<string> {
  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) {
    console.log("ffmpeg not found; skipping output normalization.");
    return inputPath;
  }

  const targetW = 1080;
  const targetH = 1920;
  const pre = await probeVideo(inputPath);
  try {
    fs.writeFileSync(
      path.join(tmpDir, "probe-before.json"),
      JSON.stringify(pre, null, 2)
    );
  } catch {
    // best-effort
  }

  // If the Remotion render already produced a true 9:16 square-pixel raster,
  // avoid a second lossy transcode. Remux only to move the MP4 header forward.
  const alreadyCompliant =
    pre.width === targetW &&
    pre.height === targetH &&
    (!pre.rotate || pre.rotate === 0) &&
    (!pre.sar || pre.sar === "1:1");

  if (alreadyCompliant) {
    console.log("Output already 1080x1920 with square pixels; remuxing without video re-encode.");
    const remux = await runCmd("ffmpeg", [
      "-y",
      "-hide_banner",
      "-i",
      inputPath,
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-c:v",
      "copy",
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      outPath,
    ]);

    if (remux.code === 0) {
      return outPath;
    }

    try {
      fs.writeFileSync(path.join(tmpDir, "ffmpeg-remux.stderr.txt"), remux.stderr);
    } catch {
      // best-effort
    }
    console.log("Lossless remux failed; falling back to full normalization pass.");
  }

  const cropRaw = await detectCrop(inputPath);
  const cropParsed = parseCrop(cropRaw);
  const cropIsMeaningful =
    cropParsed &&
    pre.width > 0 &&
    pre.height > 0 &&
    // Avoid over-cropping due to intentional vignettes/gradients.
    (cropParsed.w <= pre.width - 80 || cropParsed.h <= pre.height - 80);
  const crop = cropIsMeaningful ? cropRaw : "";
  const cropPrefix = crop ? `crop=${crop},` : "";

  // Force a true 9:16 raster with square pixels. If cropdetect found bars, remove them first.
  const vf = `${cropPrefix}scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1`;
  const strictVf = `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1`;

  const runNormalizePass = async (
    passName: string,
    vfExpr: string,
    input: string,
    output: string,
    extraArgs: string[] = []
  ) => {
    console.log(`Normalizing output MP4 (${passName}) to ${targetW}x${targetH} (vf="${vfExpr}")...`);
    return await runCmd("ffmpeg", [
      "-y",
      "-hide_banner",
      ...extraArgs,
      "-i",
      input,
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-vf",
      vfExpr,
      "-metadata:s:v:0",
      "rotate=0",
      "-aspect",
      "9:16",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-maxrate",
      "14M",
      "-bufsize",
      "20M",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      output,
    ]);
  };

  const firstPass = await runNormalizePass("cropdetect", vf, inputPath, outPath);
  if (firstPass.code !== 0) {
    try {
      fs.writeFileSync(path.join(tmpDir, "ffmpeg-normalize.stderr.txt"), firstPass.stderr);
    } catch {
      // best-effort
    }
  }

  let post = firstPass.code === 0 ? await probeVideo(outPath) : { width: 0, height: 0, sar: "", dar: "", rotate: 0 };
  const firstPassOk =
    firstPass.code === 0 &&
    post.width === targetW &&
    post.height === targetH &&
    (!post.rotate || post.rotate === 0);

  if (!firstPassOk) {
    const fallbackPath = outPath.replace(/\.mp4$/i, "-strict.mp4");
    const secondPass = await runNormalizePass(
      "strict",
      strictVf,
      inputPath,
      fallbackPath,
      ["-noautorotate"]
    );

    if (secondPass.code !== 0) {
      try {
        fs.writeFileSync(path.join(tmpDir, "ffmpeg-normalize-strict.stderr.txt"), secondPass.stderr);
      } catch {
        // best-effort
      }
      throw new Error(
        `ffmpeg normalization failed in both passes. First pass code=${firstPass.code}, second pass code=${secondPass.code}`
      );
    }

    post = await probeVideo(fallbackPath);
    if (post.width !== targetW || post.height !== targetH || (post.rotate && post.rotate !== 0)) {
      throw new Error(
        `Normalized video raster invalid: got ${post.width}x${post.height} rotate=${post.rotate || 0}, expected ${targetW}x${targetH}`
      );
    }

    try {
      fs.copyFileSync(fallbackPath, outPath);
    } catch (e) {
      throw new Error(`Failed to finalize strict normalized output: ${String((e as any)?.message || e)}`);
    }
  }

  if (post.width !== targetW || post.height !== targetH) {
    throw new Error(`Output video raster is not ${targetW}x${targetH}: got ${post.width}x${post.height}`);
  }

  try {
    fs.writeFileSync(
      path.join(tmpDir, "probe-after.json"),
      JSON.stringify(post, null, 2)
    );
  } catch {
    // best-effort
  }

  console.log(
    `Normalized video probe: ${post.width}x${post.height} sar=${post.sar || "?"} dar=${post.dar || "?"} rotate=${post.rotate || 0}`
  );
  return outPath;
}

async function renderPublishedVideo(
  job: RenderJob,
  tmpDir: string,
  outputIndex = 0
): Promise<string> {
  const clipUrls = Array.isArray(job.clipUrls)
    ? job.clipUrls.map((u) => String(u || "").trim()).filter((u) => /^https?:\/\//i.test(u))
    : [];
  if (!clipUrls.length) {
    throw new Error("Render job requires at least one clip URL.");
  }

  const clipSlug = `${String(outputIndex + 1).padStart(2, "0")}-${slugify(job.title, "video")}`;
  const audioPath = path.join(tmpDir, `voiceover-${clipSlug}.mp3`);
  let resolvedAudioSrc = "";
  let audioDuration = 0;

  if (!job.includeClipAudio) {
    if (job.generatedAudioPath && fs.existsSync(job.generatedAudioPath)) {
      console.log("Using locally generated audio file from talking-head stage.");
      resolvedAudioSrc = fileToDataUri(job.generatedAudioPath, "audio/mpeg");
      audioDuration = await getAudioDuration(job.generatedAudioPath);
    } else if (job.audioUrl) {
      console.log("Using provided audio URL from payload.");
      await downloadToFile(job.audioUrl, audioPath);
      resolvedAudioSrc = fileToDataUri(audioPath, "audio/mpeg");
      audioDuration = await getAudioDuration(audioPath);
    } else if (job.narrationText) {
      try {
        await synthesizeVoiceoverElevenLabs(
          job.narrationText,
          job.voiceId || "GoLTMzQJAHarswiHqv3L",
          audioPath
        );
        resolvedAudioSrc = fileToDataUri(audioPath, "audio/mpeg");
        audioDuration = await getAudioDuration(audioPath);
      } catch (err) {
        console.error("Voice synthesis failed, rendering without voiceover:", err);
      }
    }
  }

  const sceneTimelineSeconds = (job.scenes || []).reduce((sum, scene) => {
    const duration = Number((scene as any)?.duration || 0);
    return sum + (Number.isFinite(duration) && duration > 0 ? duration : 0);
  }, 0);

  if (!resolvedAudioSrc) {
    audioDuration = Math.max(6, sceneTimelineSeconds || clipUrls.length * 5 || 15);
    console.log(
      `Rendering with ${job.includeClipAudio ? "source clip audio" : "no external audio source"} over ${audioDuration}s timeline.`
    );
  }

  const subtitlesSeconds =
    audioDuration > 0
      ? Math.min(audioDuration, sceneTimelineSeconds || audioDuration)
      : Math.max(6, sceneTimelineSeconds || 6);

  const renderClipUrls = await stageClipUrlsLocally(clipUrls, tmpDir);
  const renderProps = {
    clipUrls: renderClipUrls,
    audioUrl: resolvedAudioSrc,
    scenes: job.scenes,
    title: job.title,
    fps: 30,
    audioDurationInSeconds: subtitlesSeconds,
    includeClipAudio: Boolean(job.includeClipAudio),
  };

  console.log("Bundling Remotion project...");
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFilePath);
  const entryPoint = path.resolve(currentDir, "index.ts");
  const bundled = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log("Selecting composition...");
  const composition = await selectComposition({
    serveUrl: bundled,
    id: "DignitateVideo",
    inputProps: renderProps,
  });

  const outputPath = path.join(tmpDir, `output-${clipSlug}.mp4`);
  console.log(`Rendering video (${composition.durationInFrames} frames)...`);

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    crf: 13,
    imageFormat: "png",
    pixelFormat: "yuv420p",
    audioBitrate: "256k",
    encodingMaxRate: "20M",
    encodingBufferSize: "30M",
    outputLocation: outputPath,
    inputProps: renderProps,
    concurrency: 2,
    onProgress: ({ progress }) => {
      if (Math.round(progress * 100) % 10 === 0) {
        console.log(`Render progress: ${Math.round(progress * 100)}%`);
      }
    },
  });

  console.log("Render complete!");
  const normalizedPath = await normalizeOutputVideo(
    outputPath,
    path.join(tmpDir, `output-${clipSlug}-vertical.mp4`),
    tmpDir
  );

  const videoKey = `videos/${Date.now()}-${slugify(job.title, "video")}.mp4`;
  return await publishRenderedVideo(normalizedPath, videoKey);
}

async function main() {
  console.log("=== Dignitate Video Renderer ===");

  // Create temp directory early so GitHub Actions can always upload a debug artifact,
  // even if we fail before bundling/rendering (e.g. missing secrets).
  const tmpDir = "/tmp/remotion-render";
  fs.mkdirSync(tmpDir, { recursive: true });

  // Parse input props from environment
  const rawInput = process.env.INPUT_PROPS;
  if (!rawInput) {
    throw new Error("INPUT_PROPS environment variable is required");
  }

  const input: RenderInput = parseRenderInput(rawInput);
  const talkingHeadMode = isTalkingHeadInput(input, Array.isArray(input.scenes) ? input.scenes : []);
  if (talkingHeadMode && Array.isArray(input.scenes) && input.scenes.length > 0) {
    // Talking-head stays single-scene, but duration should follow the real audio later.
    const s0: any = input.scenes[0] || {};
    input.scenes = [
      {
        ...s0,
        type: "hook",
        index: 0,
        duration: 0,
      },
    ];
  }

  console.log(`Title: ${input.title}`);
  console.log(`Clips: ${input.clipUrls.length}`);
  console.log(`Scenes: ${input.scenes.length}`);
  console.log(`Video mode: ${clean(input.videoMode) || "kling_multiclip"}`);

  // Lightweight debug snapshot (no secret values).
  try {
    const dbg = {
      title: input.title,
      chatId: input.chatId,
      videoMode: clean(input.videoMode),
      targetDurationSec: Number(input.targetDurationSec || 0),
      talkingHeadMode,
      scenes: (input.scenes || []).map((s) => ({
        index: (s as any)?.index,
        type: (s as any)?.type,
        duration: (s as any)?.duration,
        hasSceneImagePrompt: Boolean(clean((s as any)?.sceneImagePrompt)),
        hasVideoPrompt: Boolean(clean((s as any)?.videoPrompt)),
      })),
      hasClipUrls: Array.isArray(input.clipUrls) && input.clipUrls.length > 0,
      hasClipRequests: Array.isArray(input.clipRequests) && input.clipRequests.length > 0,
      hasScenes: Array.isArray(input.scenes) && input.scenes.length > 0,
      hasAudioUrl: Boolean(clean((input as any)?.audioUrl)),
      hasNarrationText: Boolean(clean((input as any)?.narrationText)),
      hasCreatorImageUrls:
        Array.isArray((input as any)?.creatorImageUrls) && (input as any)?.creatorImageUrls.length > 0,
      env: {
        hasFAL_KEY: Boolean(String(process.env.FAL_KEY || "").trim()),
        hasELEVENLABS_API_KEY: Boolean(String(process.env.ELEVENLABS_API_KEY || "").trim()),
        hasSUPABASE_URL: Boolean(String(process.env.SUPABASE_URL || "").trim()),
        hasSUPABASE_SERVICE_ROLE_KEY: Boolean(String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()),
        hasSUPABASE_BUCKET: Boolean(String(process.env.SUPABASE_BUCKET || "").trim()),
        hasN8N_WEBHOOK_URL: Boolean(String(process.env.N8N_WEBHOOK_URL || "").trim()),
      },
    };
    fs.writeFileSync(path.join(tmpDir, "debug-input.json"), JSON.stringify(dbg, null, 2));
  } catch {
    // best-effort only
  }

  const mode = clean(input.videoMode).toLowerCase();
  const falKey = String(process.env.FAL_KEY || "").trim();
  let videoUrls: string[] = [];
  let videoTitles: string[] = [];
  let videoDescriptions: string[] = [];

  if (isMeetingReelsInput(input)) {
    if (!falKey) {
      throw new Error("FAL_KEY is required for meeting_reels transcription and highlight extraction.");
    }

    const meetingJobs = await prepareMeetingReels(input, falKey, tmpDir);
    videoTitles = meetingJobs.map((job) => clean(job.title)).filter(Boolean);
    videoDescriptions = meetingJobs.map((job) => clean(job.description)).filter(Boolean);
    for (let i = 0; i < meetingJobs.length; i++) {
      console.log(`Rendering meeting reel ${i + 1}/${meetingJobs.length}...`);
      const url = await renderPublishedVideo(meetingJobs[i], tmpDir, i);
      videoUrls.push(url);
    }
  } else {
    let remoteClipUrls = (input.clipUrls || [])
      .map((u) => String(u || "").trim())
      .filter((u) => /^https?:\/\//i.test(u));

    if (remoteClipUrls.length === 0 && (input.clipRequests || []).length > 0) {
      remoteClipUrls = await resolveClipUrlsFromFal(input.clipRequests);
    }

    if (remoteClipUrls.length === 0 && (input.scenes || []).length > 0) {
      if (!falKey) {
        throw new Error(
          [
            "FAL_KEY is missing.",
            "This workflow generates scene images + clips inside GitHub Actions, so FAL_KEY must be set as a repository Actions secret:",
            "Repo -> Settings -> Secrets and variables -> Actions -> New repository secret -> Name: FAL_KEY",
          ].join(" ")
        );
      }
      remoteClipUrls = await generateClipsFromScenes(input);
    }

    if (remoteClipUrls.length === 0) {
      throw new Error(
        "No valid clip URLs were provided (and no resolvable clipRequests were provided)."
      );
    }

    videoUrls.push(
      await renderPublishedVideo(
        {
          title: input.title,
          chatId: input.chatId,
          clipUrls: remoteClipUrls,
          scenes: input.scenes,
          audioUrl: input.audioUrl,
          narrationText: input.narrationText,
          voiceId: input.voiceId,
          generatedAudioPath: clean((input as any).__generatedAudioPath),
          includeClipAudio: false,
        },
        tmpDir,
        0
      )
    );
  }

  if (!videoUrls.length) {
    throw new Error(`No videos were rendered for mode ${mode || "default"}.`);
  }

  const primaryVideoUrl = videoUrls[0];

  // Callback to n8n webhook
  const webhookUrl = resolveN8nWebhookUrl(input);
  if (webhookUrl) {
    try {
      console.log("Sending callback to n8n...");
      const callbackResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: primaryVideoUrl,
          videoUrls,
          videoTitles,
          videoDescriptions,
          status: "success",
          title: input.title,
          chatId: input.chatId,
          assetType: isMeetingReelsInput(input) ? "meeting_reels" : "video",
        }),
      });
      console.log(`Callback response: ${callbackResponse.status}`);
    } catch (e) {
      console.log(`Callback warning: ${String((e as any)?.message || e).slice(0, 220)}`);
    }
  }

  // Output for GitHub Actions
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `video_url=${primaryVideoUrl}\n`);
    fs.appendFileSync(outputFile, `video_urls_json=${JSON.stringify(videoUrls)}\n`);
  }

  console.log(`\nDone! Video URL: ${primaryVideoUrl}`);
}

main().catch(async (err) => {
  console.error("Render failed:", err);

  // Ensure tmp dir exists and write a short error note for artifact debugging.
  try {
    const tmpDir = "/tmp/remotion-render";
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, "error.txt"),
      String((err as any)?.stack || (err as any)?.message || err)
    );
  } catch {
    // best-effort only
  }

  // Send failure callback
  const rawInput = process.env.INPUT_PROPS;
  let parsedInput: RenderInput | null = null;
  try {
    parsedInput = rawInput ? parseRenderInput(rawInput) : null;
  } catch {
    parsedInput = null;
  }
  const webhookUrl = resolveN8nWebhookUrl(parsedInput);
  if (webhookUrl && parsedInput) {
    const input = parsedInput;
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "failed",
          error: String(err),
          title: input.title,
          chatId: input.chatId,
        }),
      });
    } catch {
      // best-effort only
    }
  }

  process.exit(1);
});
