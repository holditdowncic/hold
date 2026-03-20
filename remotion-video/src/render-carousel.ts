import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

interface CarouselSlideInput {
  role?: string;
  heading?: string;
  subline?: string;
}

interface CarouselRenderInput {
  title: string;
  chatId: string;
  slides: CarouselSlideInput[];
  backgroundImageUrls: string[];
  caption?: string;
  hashtags?: string[];
  args?: string;
  n8nWebhookUrl?: string;
}

const clean = (value: unknown): string =>
  String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();

function parseInput(rawInput: string): CarouselRenderInput {
  const parsed = JSON.parse(rawInput);
  let candidate: any = parsed;

  if (candidate && typeof candidate === "object" && candidate.job) {
    candidate = candidate.job;
  }

  if (candidate && typeof candidate === "object" && candidate.client_payload?.job) {
    candidate = candidate.client_payload.job;
  }

  return {
    title: clean(candidate?.title || "Untitled Carousel"),
    chatId: clean(candidate?.chatId || ""),
    slides: Array.isArray(candidate?.slides) ? candidate.slides : [],
    backgroundImageUrls: Array.isArray(candidate?.backgroundImageUrls)
      ? candidate.backgroundImageUrls.map((u: unknown) => clean(u)).filter(Boolean)
      : [],
    caption: clean(candidate?.caption || ""),
    hashtags: Array.isArray(candidate?.hashtags)
      ? candidate.hashtags.map((h: unknown) => clean(h)).filter(Boolean)
      : [],
    args: clean(candidate?.args || ""),
    n8nWebhookUrl: clean(candidate?.n8nWebhookUrl || ""),
  };
}

function resolveN8nWebhookUrl(input: CarouselRenderInput | null): string {
  const payloadUrl = clean(input?.n8nWebhookUrl || "");
  if (payloadUrl) return payloadUrl;
  return clean(process.env.N8N_WEBHOOK_URL || "");
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(clean(value));
}

function inferRemoteExt(url: string): string {
  const base = clean(url).toLowerCase().split("?")[0].split("#")[0];
  if (base.endsWith(".png")) return ".png";
  if (base.endsWith(".jpg")) return ".jpg";
  if (base.endsWith(".jpeg")) return ".jpeg";
  if (base.endsWith(".webp")) return ".webp";
  return ".img";
}

async function downloadToFile(url: string, destPath: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  return destPath;
}

function inferContentTypeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function fileToDataUri(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const contentType = inferContentTypeFromExt(filePath);
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

function buildPublicAssetUrl(key: string): string {
  const publicBaseUrl = clean(process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  const resolvedBaseUrl =
    publicBaseUrl || `http://127.0.0.1:${Number(process.env.PORT || 3001)}`;
  const objectPath = String(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${resolvedBaseUrl}/public/${objectPath}`;
}

function publishToLocalPublicDir(filePath: string, key: string): string {
  const publicRoot = path.join("/tmp", "remotion-render", "public");
  const destPath = path.join(publicRoot, ...String(key).split("/"));
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(filePath, destPath);
  return buildPublicAssetUrl(key);
}

async function publishRenderedAsset(
  filePath: string,
  key: string,
  contentType = "image/png"
): Promise<string> {
  void contentType;
  // Persist on the VPS bind mount served by the render service instead of
  // sending generated assets to Supabase.
  return publishToLocalPublicDir(filePath, key);
}

async function postCallback(payload: Record<string, unknown>, input: CarouselRenderInput | null) {
  const webhookUrl = resolveN8nWebhookUrl(input);
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function main() {
  const rawInput = process.env.INPUT_PROPS;
  if (!rawInput) {
    throw new Error("INPUT_PROPS environment variable is required");
  }

  const input = parseInput(rawInput);
  if (!input.chatId) {
    throw new Error("chatId is required for carousel rendering");
  }
  if (!input.slides.length) {
    throw new Error("slides array is required for carousel rendering");
  }
  if (input.backgroundImageUrls.length < input.slides.length) {
    throw new Error(
      `Expected ${input.slides.length} background images but only received ${input.backgroundImageUrls.length}`
    );
  }

  const tmpDir = "/tmp/remotion-render";
  fs.mkdirSync(tmpDir, { recursive: true });

  const renderableImageSources: string[] = [];
  for (let i = 0; i < input.slides.length; i++) {
    const remoteUrl = input.backgroundImageUrls[i];
    if (!looksLikeUrl(remoteUrl)) {
      throw new Error(`Invalid background image URL for slide ${i + 1}: ${remoteUrl}`);
    }
    const localPath = path.join(tmpDir, `carousel-source-${i + 1}${inferRemoteExt(remoteUrl)}`);
    await downloadToFile(remoteUrl, localPath);
    renderableImageSources.push(fileToDataUri(localPath));
  }

  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFilePath);
  const entryPoint = path.resolve(currentDir, "index.ts");
  const bundled = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  const now = Date.now();
  const uploadedUrls: string[] = [];

  for (let i = 0; i < input.slides.length; i++) {
    const slide = input.slides[i] || {};
    const composition = await selectComposition({
      serveUrl: bundled,
      id: "DignitateCarouselSlide",
      inputProps: {
        slide: {
          role: clean(slide.role || (i === 0 ? "cover" : i === input.slides.length - 1 ? "conclusion" : "information")),
          heading: clean(slide.heading || ""),
          subline: clean(slide.subline || ""),
          backgroundImageUrl: renderableImageSources[i],
          slideIndex: i,
          totalSlides: input.slides.length,
          title: input.title,
        },
      },
    });

    const outputPath = path.join(tmpDir, `carousel-slide-${i + 1}.png`);
    await renderStill({
      composition,
      serveUrl: bundled,
      output: outputPath,
      imageFormat: "png",
      inputProps: {
        slide: {
          role: clean(slide.role || (i === 0 ? "cover" : i === input.slides.length - 1 ? "conclusion" : "information")),
          heading: clean(slide.heading || ""),
          subline: clean(slide.subline || ""),
          backgroundImageUrl: renderableImageSources[i],
          slideIndex: i,
          totalSlides: input.slides.length,
          title: input.title,
        },
      },
    });

    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "dignitate-carousel";

    const key = `carousels/${now}-${slug}-slide-${i + 1}.png`;
    const uploaded = await publishRenderedAsset(outputPath, key, "image/png");
    uploadedUrls.push(uploaded);
  }

  await postCallback(
    {
      assetType: "carousel",
      status: "success",
      chatId: input.chatId,
      title: input.title,
      args: input.args,
      caption: input.caption,
      hashtags: input.hashtags,
      slides: input.slides,
      allImageUrls: uploadedUrls,
      imageUrl: uploadedUrls[0] || "",
      firstImageUrl: uploadedUrls[0] || "",
      imageCount: uploadedUrls.length,
    },
    input
  );

  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `carousel_image_count=${uploadedUrls.length}\n`);
  }
}

main().catch(async (err) => {
  const rawInput = process.env.INPUT_PROPS;
  let parsed: CarouselRenderInput | null = null;
  try {
    parsed = rawInput ? parseInput(rawInput) : null;
  } catch {
    parsed = null;
  }

  try {
    await postCallback(
      {
        assetType: "carousel",
        status: "failed",
        error: String((err as Error)?.message || err),
        chatId: clean(parsed?.chatId || ""),
        title: clean(parsed?.title || "Untitled Carousel"),
      },
      parsed
    );
  } catch {
    // Best effort only.
  }

  console.error("Carousel render failed:", err);
  process.exit(1);
});
