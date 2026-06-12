export const TREE_OF_HOPE_FORM_TYPE = "tree_of_hope_contribution";

export type TreeModerationStatus = "pending" | "approved" | "rejected";

export type TreeContributionPayload = {
  id?: string;
  zoneId?: string;
  author?: string;
  message?: string;
  audioDataUrl?: string;
  audioUrl?: string;
  audioPath?: string;
  audioType?: string;
  audioDurationSeconds?: number;
  createdAt?: string;
  x?: number;
  y?: number;
  moderationStatus?: TreeModerationStatus;
  moderatedAt?: string;
  moderatedBy?: string;
  consentAccepted?: boolean;
  moderationFlags?: string[];
};

const statuses: TreeModerationStatus[] = ["pending", "approved", "rejected"];

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 1200) : fallback;
}

function cleanStatus(value: unknown): TreeModerationStatus | undefined {
  return typeof value === "string" && statuses.includes(value as TreeModerationStatus)
    ? (value as TreeModerationStatus)
    : undefined;
}

function cleanAudioUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("https://") || trimmed.startsWith("/")) return trimmed.slice(0, 1200);
  return undefined;
}

export function cleanTreeContribution(
  value: unknown,
  options: { fallbackId?: string; fallbackCreatedAt?: string; requireApproved?: boolean } = {},
): TreeContributionPayload | null {
  if (!value || typeof value !== "object") return null;

  const input = value as TreeContributionPayload;
  const message = cleanText(input.message);
  const audioDataUrl = typeof input.audioDataUrl === "string" && input.audioDataUrl.startsWith("data:audio/")
    ? input.audioDataUrl
    : undefined;
  const audioUrl = cleanAudioUrl(input.audioUrl);
  const audioPath = cleanText(input.audioPath).slice(0, 260) || undefined;
  const moderationStatus = cleanStatus(input.moderationStatus) || "pending";
  const audioDurationSeconds =
    typeof input.audioDurationSeconds === "number" && Number.isFinite(input.audioDurationSeconds)
      ? Math.max(0, Math.min(60, input.audioDurationSeconds))
      : undefined;

  if (!message && !audioDataUrl && !audioUrl) return null;
  if (options.requireApproved && moderationStatus !== "approved") return null;

  return {
    id: cleanText(input.id, options.fallbackId || crypto.randomUUID()).slice(0, 80),
    zoneId: cleanText(input.zoneId, "canopy").slice(0, 40),
    author: cleanText(input.author, "Community voice").slice(0, 80) || "Community voice",
    message,
    audioDataUrl,
    audioUrl,
    audioPath,
    audioType: cleanText(input.audioType).slice(0, 80) || undefined,
    audioDurationSeconds,
    createdAt: cleanText(input.createdAt, options.fallbackCreatedAt || new Date().toISOString()),
    x: typeof input.x === "number" ? input.x : undefined,
    y: typeof input.y === "number" ? input.y : undefined,
    moderationStatus,
    moderatedAt: cleanText(input.moderatedAt).slice(0, 80) || undefined,
    moderatedBy: cleanText(input.moderatedBy).slice(0, 80) || undefined,
    consentAccepted: input.consentAccepted === true,
    moderationFlags: Array.isArray(input.moderationFlags)
      ? input.moderationFlags
          .filter((flag): flag is string => typeof flag === "string")
          .map((flag) => flag.trim().toLowerCase().slice(0, 40))
          .filter(Boolean)
      : undefined,
  };
}

export function treeZoneLabel(zoneId?: string) {
  switch (zoneId) {
    case "roots":
      return "Roots";
    case "trunk":
      return "Trunk";
    case "left-branch":
      return "Left branch";
    case "right-branch":
      return "Right branch";
    case "canopy":
      return "Leaves";
    default:
      return zoneId || "Tree";
  }
}
