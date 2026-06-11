export const TREE_OF_HOPE_FORM_TYPE = "tree_of_hope_contribution";

export type TreeModerationStatus = "pending" | "approved" | "rejected";

export type TreeContributionPayload = {
  id?: string;
  zoneId?: string;
  author?: string;
  message?: string;
  audioDataUrl?: string;
  audioType?: string;
  createdAt?: string;
  x?: number;
  y?: number;
  moderationStatus?: TreeModerationStatus;
  moderatedAt?: string;
  moderatedBy?: string;
  consentAccepted?: boolean;
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
  const moderationStatus = cleanStatus(input.moderationStatus) || "pending";

  if (!message && !audioDataUrl) return null;
  if (options.requireApproved && moderationStatus !== "approved") return null;

  return {
    id: cleanText(input.id, options.fallbackId || crypto.randomUUID()).slice(0, 80),
    zoneId: cleanText(input.zoneId, "canopy").slice(0, 40),
    author: cleanText(input.author, "Community voice").slice(0, 80) || "Community voice",
    message,
    audioDataUrl,
    audioType: cleanText(input.audioType).slice(0, 80) || undefined,
    createdAt: cleanText(input.createdAt, options.fallbackCreatedAt || new Date().toISOString()),
    x: typeof input.x === "number" ? input.x : undefined,
    y: typeof input.y === "number" ? input.y : undefined,
    moderationStatus,
    moderatedAt: cleanText(input.moderatedAt).slice(0, 80) || undefined,
    moderatedBy: cleanText(input.moderatedBy).slice(0, 80) || undefined,
    consentAccepted: input.consentAccepted === true,
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
