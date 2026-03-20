import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

type JobKind = "video" | "carousel";
type FounderCoverRequest = {
  imageUrl?: string;
  title?: string;
  label?: string;
};
type ArchiveRequestItem = {
  archiveId?: string;
  title?: string;
  parentTitle?: string;
  videoUrl?: string;
  caption?: string;
  description?: string;
  hashtags?: string[];
  assetType?: string;
  chatId?: string;
  sourceArgs?: string;
  approvedAt?: string;
  archivedAt?: string;
};

type QueueJob = {
  id: string;
  kind: JobKind;
  payload: unknown;
  enqueuedAt: number;
};

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || "0.0.0.0";
const MAX_CONCURRENCY = Math.max(1, Number(process.env.MAX_CONCURRENCY || 1));
const PUBLIC_ROOT = path.join("/tmp", "remotion-render", "public");
const LOG_ROOT = path.join("/tmp", "remotion-render", "jobs");
const LOCAL_PUBLIC_MATCHERS = [
  /^https?:\/\/187\.77\.178\.148:3001\/public\/(.+)$/i,
  /^https?:\/\/srv1417199\.hstgr\.cloud\/public\/(.+)$/i,
];

const queue: QueueJob[] = [];
let activeJobs = 0;

fs.mkdirSync(PUBLIC_ROOT, { recursive: true });
fs.mkdirSync(LOG_ROOT, { recursive: true });

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), "..");

function sendJson(res: http.ServerResponse, statusCode: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(json),
  });
  res.end(json);
}

function safeParseJson(raw: string): unknown {
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function normalizePayload(body: any): any {
  if (body && typeof body === "object" && body.job) return body;
  return { job: body || {} };
}

function validatePayload(kind: JobKind, payload: any): string | null {
  const job = payload?.job || {};
  if (!job || typeof job !== "object") return "job payload is required";
  if (!String(job.chatId || "").trim()) return "job.chatId is required";
  if (kind === "video") {
    const mode = String(job.videoMode || job.video_mode || "").trim().toLowerCase();
    const hasClipUrls = Array.isArray(job.clipUrls) && job.clipUrls.length > 0;
    const hasClipRequests = Array.isArray(job.clipRequests) && job.clipRequests.length > 0;
    const hasScenes = Array.isArray(job.scenes) && job.scenes.length > 0;
    const hasSourceVideoUrl = /^https?:\/\//i.test(
      String(job.sourceVideoUrl || job.source_video_url || "").trim()
    );
    const isMeetingReels = mode === "meeting_reels";
    if (!hasClipUrls && !hasClipRequests && !hasScenes && !(isMeetingReels && hasSourceVideoUrl)) {
      return "video job requires clipUrls, clipRequests, scenes, or sourceVideoUrl for meeting_reels";
    }
    return null;
  }

  const slides = Array.isArray(job.slides) ? job.slides : [];
  const backgroundImageUrls = Array.isArray(job.backgroundImageUrls) ? job.backgroundImageUrls : [];
  if (!slides.length) return "carousel job requires slides";
  if (backgroundImageUrls.length < slides.length) {
    return "carousel job requires at least one background image per slide";
  }
  return null;
}

function createJob(kind: JobKind, payload: unknown): QueueJob {
  return {
    id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    payload,
    enqueuedAt: Date.now(),
  };
}

function cleanText(value: unknown): string {
  return String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function slugifySegment(value: unknown, fallback = "asset"): string {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || fallback;
}

function publicBaseUrl(): string {
  return String(process.env.PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
}

function publicUrlForObject(relativePath: string): string {
  const objectPath = String(relativePath || "").replace(/^\/+/, "");
  const configured = publicBaseUrl();
  if (configured) return `${configured}/public/${objectPath}`;
  return `http://127.0.0.1:${PORT}/public/${objectPath}`;
}

function quoteFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/%/g, "\\%");
}

function wrapCoverTitle(value: string, maxChars = 14, maxLines = 4): string[] {
  const words = cleanText(value).split(/\s+/).filter(Boolean);
  if (!words.length) return ["Dignitate", "Reel"];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  const usedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (usedWords < words.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1]}...`;
  }
  return lines.slice(0, maxLines);
}

async function runTool(
  command: string,
  args: string[],
  options: { cwd?: string } = {}
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

async function commandExists(command: string): Promise<boolean> {
  try {
    const res = await runTool("sh", ["-lc", `command -v ${command}`]);
    return res.code === 0 && cleanText(res.stdout).length > 0;
  } catch {
    return false;
  }
}

function pickFontPath(bold = false): string {
  const candidates = bold
    ? [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
      ]
    : [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
      ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}

function drawtextFilter(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  bold = true,
  fontColor = "white"
): string {
  const fontPath = pickFontPath(bold);
  const prefix = fontPath
    ? `drawtext=fontfile='${quoteFilterValue(fontPath)}'`
    : "drawtext=font='Sans'";
  return `${prefix}:text='${quoteFilterValue(text)}':fontcolor=${fontColor}:fontsize=${fontSize}:x=${x}:y=${y}`;
}

async function generateFounderCover(request: FounderCoverRequest): Promise<{ coverUrl: string; coverPath: string }> {
  const imageUrl = cleanText(request.imageUrl);
  const title = cleanText(request.title || "Dignitate Reel");
  const label = cleanText(request.label || "DIGNITATE");
  if (!imageUrl) {
    throw new Error("imageUrl is required for founder cover generation");
  }
  const ffmpegOk = await commandExists("ffmpeg");
  if (!ffmpegOk) {
    throw new Error("ffmpeg is required to generate founder cover assets");
  }

  const buffer = await fetchBuffer(imageUrl);
  const tmpDir = fs.mkdtempSync(path.join(LOG_ROOT, "cover-"));
  const inputPath = path.join(tmpDir, `input-${Date.now()}.png`);
  fs.writeFileSync(inputPath, buffer);

  const relPath = path.posix.join(
    "covers",
    `${Date.now()}-${slugifySegment(title, "founder-reel-cover")}.png`
  );
  const outputPath = path.join(PUBLIC_ROOT, relPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const titleLines = wrapCoverTitle(title, 13, 4);
  const titleBaseY = titleLines.length >= 4 ? 250 : titleLines.length === 3 ? 320 : 410;
  const drawFilters = [
    "drawbox=x=72:y=150:w=154:h=10:color=0x20B8B2:t=fill",
    "drawbox=x=72:y=162:w=108:h=3:color=0x8AE7DE:t=fill",
    drawtextFilter(label, 72, 92, 30, true, "0x8AE7DE"),
  ];
  titleLines.forEach((line, idx) => {
    drawFilters.push(drawtextFilter(line, 72, titleBaseY + (idx * 90), idx === 0 ? 86 : 80, true));
  });
  drawFilters.push(
    drawtextFilter("dignitate", 72, 1742, 30, false, "0x20B8B2")
  );
  drawFilters.push(
    drawtextFilter("@dignitate", 72, 1688, 22, false, "0x8AE7DE")
  );

  const filterGraph = [
    "[0:v]noise=alls=6:allf=t+u,drawbox=x=0:y=0:w=1080:h=1920:color=0x081315@0.30:t=fill[base]",
    "[1:v]scale=690:1380:force_original_aspect_ratio=increase,crop=690:1380[portrait]",
    "[portrait]split=2[portrait_main][portrait_shadow_src]",
    "[portrait_shadow_src]format=rgba,colorchannelmixer=aa=0.30,boxblur=22:8[shadow]",
    "[base]drawbox=x=458:y=272:w=566:h=1332:color=0x1AA6A6@0.96:t=12[bg0]",
    "[bg0][shadow]overlay=x=380:y=332[bg1]",
    "[bg1][portrait_main]overlay=x=350:y=300[bg2]",
    "[bg2]drawbox=x=446:y=258:w=590:h=1360:color=0x8AE7DE@0.16:t=3[bg2b]",
    "[bg2b]drawbox=x=0:y=1538:w=1080:h=382:color=0x000000@0.28:t=fill[bg3]",
    ...drawFilters.map((filter, idx) => `${idx === 0 ? "[bg3]" : `[t${idx - 1}]`}${filter}[t${idx}]`),
  ];

  const finalLabel = `t${drawFilters.length - 1}`;
  const result = await runTool("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=0x0F1115:s=1080x1920:d=1",
    "-loop",
    "1",
    "-i",
    inputPath,
    "-filter_complex",
    filterGraph.join(";"),
    "-map",
    `[${finalLabel}]`,
    "-frames:v",
    "1",
    outputPath,
  ]);

  if (result.code !== 0 || !fs.existsSync(outputPath)) {
    throw new Error(`ffmpeg founder cover generation failed: ${cleanText(result.stderr).slice(0, 500)}`);
  }

  return {
    coverPath: outputPath,
    coverUrl: publicUrlForObject(relPath),
  };
}

function slugify(value: unknown, fallback = "clip"): string {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

function getIsoWeekInfo(input?: string): { year: number; week: number; tag: string; label: string } {
  const parsed = input ? new Date(input) : new Date();
  const valid = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const utcDate = new Date(Date.UTC(valid.getUTCFullYear(), valid.getUTCMonth(), valid.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const year = utcDate.getUTCFullYear();
  const paddedWeek = String(week).padStart(2, "0");
  return {
    year,
    week,
    tag: `approved-clips-${year}-w${paddedWeek}`,
    label: `Approved Clips ${year} W${paddedWeek}`,
  };
}

function getArchiveConfig() {
  const token = String(process.env.GITHUB_ARCHIVE_TOKEN || "").trim();
  const owner = String(process.env.GITHUB_ARCHIVE_OWNER || "dignitatesocial").trim();
  const repo = String(process.env.GITHUB_ARCHIVE_REPO || "dignitatevideo").trim();
  if (!token) {
    throw new Error("GITHUB_ARCHIVE_TOKEN is missing");
  }
  if (!owner || !repo) {
    throw new Error("GitHub archive owner/repo is missing");
  }
  return { token, owner, repo };
}

async function githubJsonRequest(
  pathname: string,
  init: RequestInit,
  config: { token: string; owner: string; repo: string }
): Promise<any> {
  const res = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "User-Agent": "dignitate-renderer-archive",
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API ${pathname} failed (${res.status}): ${errorText.slice(0, 500)}`);
  }

  return res.json();
}

async function getOrCreateRelease(
  tag: string,
  label: string,
  config: { token: string; owner: string; repo: string }
): Promise<any> {
  const releasePath = `/repos/${config.owner}/${config.repo}/releases/tags/${encodeURIComponent(tag)}`;

  const existing = await fetch(`https://api.github.com${releasePath}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "User-Agent": "dignitate-renderer-archive",
    },
  });
  if (existing.ok) {
    return existing.json();
  }
  if (existing.status !== 404) {
    const errorText = await existing.text();
    throw new Error(`GitHub release lookup failed (${existing.status}): ${errorText.slice(0, 500)}`);
  }

  return githubJsonRequest(
    `/repos/${config.owner}/${config.repo}/releases`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tag_name: tag,
        name: label,
        body: `Approved Dignitate clips archived automatically for ${label}.`,
        draft: false,
        prerelease: false,
      }),
    },
    config
  );
}

async function fetchBuffer(url: string): Promise<Buffer> {
  let resolvedUrl = String(url || "").trim();
  for (const matcher of LOCAL_PUBLIC_MATCHERS) {
    const match = resolvedUrl.match(matcher);
    if (match?.[1]) {
      resolvedUrl = `http://127.0.0.1:${PORT}/public/${match[1]}`;
      break;
    }
  }

  const res = await fetch(resolvedUrl);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to download asset (${res.status}) from ${resolvedUrl}: ${errorText.slice(0, 300)}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadReleaseAsset(
  uploadUrlTemplate: string,
  assetName: string,
  contentType: string,
  content: Buffer,
  config: { token: string; owner: string; repo: string }
): Promise<any> {
  const uploadUrl = `${uploadUrlTemplate.replace(/\{.*$/, "")}?name=${encodeURIComponent(assetName)}`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": contentType,
      "Content-Length": String(content.length),
      "User-Agent": "dignitate-renderer-archive",
    },
    body: new Uint8Array(content),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub asset upload failed (${res.status}) for ${assetName}: ${errorText.slice(0, 500)}`);
  }
  return res.json();
}

async function archiveApprovedClips(items: ArchiveRequestItem[]) {
  const config = getArchiveConfig();
  const archived: any[] = [];
  const skipped: any[] = [];
  const failed: any[] = [];

  const grouped = new Map<string, ArchiveRequestItem[]>();
  for (const item of items) {
    const videoUrl = cleanText(item.videoUrl);
    const archiveId = cleanText(item.archiveId);
    if (!archiveId || !videoUrl) {
      skipped.push({
        archiveId: archiveId || "",
        title: cleanText(item.title),
        reason: "missing archiveId or videoUrl",
      });
      continue;
    }
    const info = getIsoWeekInfo(cleanText(item.approvedAt));
    const key = `${info.tag}|${info.label}`;
    const list = grouped.get(key) || [];
    list.push(item);
    grouped.set(key, list);
  }

  for (const [groupKey, groupItems] of grouped.entries()) {
    const [archiveTag, archiveLabel] = groupKey.split("|");
    const release = await getOrCreateRelease(archiveTag, archiveLabel, config);
    const releaseAssets = new Map<string, any>(
      (Array.isArray(release.assets) ? release.assets : []).map((asset: any) => [String(asset.name), asset])
    );

    for (const item of groupItems) {
      const archiveId = cleanText(item.archiveId);
      const approvedAt = cleanText(item.approvedAt) || new Date().toISOString();
      const baseName = `${slugify(item.parentTitle || item.title || "approved-clip")}-${slugify(item.title || "clip")}-${slugify(archiveId, "id")}`.slice(0, 120);
      const videoAssetName = `${baseName}.mp4`;
      const metadataAssetName = `${baseName}.json`;

      try {
        let videoAsset = releaseAssets.get(videoAssetName);
        if (!videoAsset) {
          const videoBuffer = await fetchBuffer(cleanText(item.videoUrl));
          videoAsset = await uploadReleaseAsset(release.upload_url, videoAssetName, "video/mp4", videoBuffer, config);
          releaseAssets.set(videoAssetName, videoAsset);
        }

        let metadataAsset = releaseAssets.get(metadataAssetName);
        if (!metadataAsset) {
          const metadata = {
            archiveId,
            archiveTag,
            archivedAt: new Date().toISOString(),
            approvedAt,
            title: cleanText(item.title),
            parentTitle: cleanText(item.parentTitle),
            caption: cleanText(item.caption),
            description: cleanText(item.description),
            hashtags: Array.isArray(item.hashtags) ? item.hashtags.map((value) => cleanText(value)).filter(Boolean) : [],
            assetType: cleanText(item.assetType || "video"),
            chatId: cleanText(item.chatId),
            sourceArgs: cleanText(item.sourceArgs),
            sourceVideoUrl: cleanText(item.videoUrl),
          };
          metadataAsset = await uploadReleaseAsset(
            release.upload_url,
            metadataAssetName,
            "application/json",
            Buffer.from(JSON.stringify(metadata, null, 2), "utf8"),
            config
          );
          releaseAssets.set(metadataAssetName, metadataAsset);
        }

        archived.push({
          archiveId,
          archivedAt: new Date().toISOString(),
          archiveTag,
          archiveReleaseUrl: String(release.html_url || ""),
          archiveAssetUrl: String(videoAsset.browser_download_url || ""),
          archiveMetadataUrl: String(metadataAsset.browser_download_url || ""),
          title: cleanText(item.title),
        });
      } catch (error: any) {
        failed.push({
          archiveId,
          title: cleanText(item.title),
          error: String(error?.message || error || "unknown archive error"),
        });
      }
    }
  }

  return { archived, skipped, failed };
}

function runNext(): void {
  if (activeJobs >= MAX_CONCURRENCY) return;
  const job = queue.shift();
  if (!job) return;

  activeJobs += 1;

  const entry = job.kind === "video" ? "src/render.ts" : "src/render-carousel.ts";
  const logPath = path.join(LOG_ROOT, `${job.id}.log`);
  const out = fs.createWriteStream(logPath, { flags: "a" });
  out.write(`[${new Date().toISOString()}] starting ${job.kind} job ${job.id}\n`);

  const child = spawn("npx", ["tsx", entry], {
    cwd: projectRoot,
    env: {
      ...process.env,
      INPUT_PROPS: JSON.stringify(job.payload),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => out.write(chunk));
  child.stderr.on("data", (chunk) => out.write(chunk));

  child.on("close", (code, signal) => {
    out.write(`\n[${new Date().toISOString()}] finished code=${code ?? "null"} signal=${signal ?? "null"}\n`);
    out.end();
    activeJobs = Math.max(0, activeJobs - 1);
    runNext();
  });

  child.on("error", (err) => {
    out.write(`\n[${new Date().toISOString()}] spawn error: ${String(err.message || err)}\n`);
    out.end();
    activeJobs = Math.max(0, activeJobs - 1);
    runNext();
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, {
      ok: true,
      activeJobs,
      queuedJobs: queue.length,
      maxConcurrency: MAX_CONCURRENCY,
      publicBaseUrl: process.env.PUBLIC_BASE_URL || "",
    });
  }

  if ((req.method === "GET" || req.method === "HEAD") && url.pathname.startsWith("/public/")) {
    const relativePath = decodeURIComponent(url.pathname.replace(/^\/public\//, ""));
    const fullPath = path.resolve(PUBLIC_ROOT, relativePath);
    if (!fullPath.startsWith(PUBLIC_ROOT)) {
      return sendJson(res, 400, { ok: false, error: "invalid public asset path" });
    }
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      return sendJson(res, 404, { ok: false, error: "asset not found" });
    }
    const ext = path.extname(fullPath).toLowerCase();
    const type =
      ext === ".mp4" ? "video/mp4" :
      ext === ".mp3" ? "audio/mpeg" :
      ext === ".wav" ? "audio/wav" :
      ext === ".png" ? "image/png" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      ext === ".webp" ? "image/webp" :
      "application/octet-stream";
    const stat = fs.statSync(fullPath);
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(fullPath).pipe(res);
    return;
  }

  if (
    req.method === "POST" &&
    (url.pathname === "/render/video" || url.pathname === "/render/carousel")
  ) {
    const kind: JobKind = url.pathname.endsWith("/video") ? "video" : "carousel";
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        const parsed = safeParseJson(raw);
        const payload = normalizePayload(parsed);
        const validationError = validatePayload(kind, payload);
        if (validationError) {
          return sendJson(res, 400, { ok: false, error: validationError });
        }

        const job = createJob(kind, payload);
        queue.push(job);
        runNext();
        return sendJson(res, 202, {
          ok: true,
          queued: true,
          jobId: job.id,
          kind,
          activeJobs,
          queuedJobs: queue.length,
        });
      } catch (err: any) {
        return sendJson(res, 400, {
          ok: false,
          error: String(err?.message || err || "invalid JSON payload"),
        });
      }
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/archive/github-release") {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      void (async () => {
        try {
          const raw = Buffer.concat(chunks).toString("utf8");
          const parsed = safeParseJson(raw) as { items?: ArchiveRequestItem[] } | ArchiveRequestItem[];
          const items = Array.isArray(parsed)
            ? parsed
            : (Array.isArray(parsed?.items) ? parsed.items : []);

          if (!items.length) {
            return sendJson(res, 200, { ok: true, archived: [], skipped: [], failed: [] });
          }

          const result = await archiveApprovedClips(items);
          return sendJson(res, 200, {
            ok: true,
            ...result,
          });
        } catch (err: any) {
          return sendJson(res, 500, {
            ok: false,
            error: String(err?.message || err || "archive failed"),
          });
        }
      })();
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/cover/founder-reel") {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      void (async () => {
        try {
          const raw = Buffer.concat(chunks).toString("utf8");
          const parsed = safeParseJson(raw) as FounderCoverRequest;
          const result = await generateFounderCover(parsed || {});
          return sendJson(res, 200, {
            ok: true,
            coverUrl: result.coverUrl,
          });
        } catch (err: any) {
          return sendJson(res, 500, {
            ok: false,
            error: String(err?.message || err || "founder cover generation failed"),
          });
        }
      })();
    });
    return;
  }

  sendJson(res, 404, { ok: false, error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`Render service listening on http://${HOST}:${PORT}`);
});
