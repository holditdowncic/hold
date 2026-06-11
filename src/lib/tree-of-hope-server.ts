import { randomUUID, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  cleanTreeContribution,
  TREE_OF_HOPE_FORM_TYPE,
  treeZoneLabel,
  type TreeContributionPayload,
  type TreeModerationStatus,
} from "@/lib/tree-of-hope";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TREE_VOICE_BUCKET = "tree-of-hope-voice-notes";
const maxAudioBytes = 8 * 1024 * 1024;
const allowedAudioTypes = ["audio/webm", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/mp4", "audio/x-m4a"];

export type TreeSubmissionRow = {
  id: string;
  payload: TreeContributionPayload;
  created_at: string;
  subject?: string | null;
};

export function getTreeAdminPassword() {
  return process.env.TREE_ADMIN_PASSWORD || process.env.TREE_ADMIN_TOKEN || "Zaniah06!";
}

export function verifyTreeAdminPassword(value: string | null | undefined) {
  const expected = getTreeAdminPassword();
  if (!expected || !value) return false;

  const expectedBuffer = Buffer.from(expected);
  const valueBuffer = Buffer.from(value);
  return expectedBuffer.length === valueBuffer.length && timingSafeEqual(expectedBuffer, valueBuffer);
}

function getSupabaseClient() {
  if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(supabaseUrl, supabaseServiceKey);
}

function cleanBase64Audio(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  if (!allowedAudioTypes.includes(mimeType)) return null;

  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > maxAudioBytes) return null;

  return { bytes, mimeType };
}

function extensionForAudio(mimeType: string) {
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  return "webm";
}

async function ensureVoiceBucket() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.createBucket(TREE_VOICE_BUCKET, {
    public: true,
  });

  if (error && !/already exists|Duplicate/i.test(error.message || "")) throw error;
}

export async function uploadTreeVoiceNote(audioDataUrl: string, submissionId: string) {
  const audio = cleanBase64Audio(audioDataUrl);
  if (!audio) {
    throw new Error("Voice note must be WebM, MP3, OGG, or M4A and under 8MB.");
  }

  const supabase = getSupabaseClient();
  const objectPath = [
    new Date().toISOString().slice(0, 10),
    `${submissionId}-${randomUUID()}.${extensionForAudio(audio.mimeType)}`,
  ].join("/");

  let { error } = await supabase.storage
    .from(TREE_VOICE_BUCKET)
    .upload(objectPath, audio.bytes, {
      contentType: audio.mimeType,
      upsert: false,
    });

  if (error && /bucket not found|not found/i.test(error.message || "")) {
    await ensureVoiceBucket();
    const retry = await supabase.storage
      .from(TREE_VOICE_BUCKET)
      .upload(objectPath, audio.bytes, {
        contentType: audio.mimeType,
        upsert: false,
      });
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(TREE_VOICE_BUCKET).getPublicUrl(objectPath);
  return {
    audioUrl: data.publicUrl,
    audioPath: `${TREE_VOICE_BUCKET}/${objectPath}`,
    audioType: audio.mimeType,
  };
}

export async function listTreeSubmissions() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select("id,payload,created_at,subject")
    .eq("form_type", TREE_OF_HOPE_FORM_TYPE)
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) throw new Error(error.message);

  return ((data || []) as TreeSubmissionRow[])
    .map((row) => {
      const contribution = cleanTreeContribution(row.payload, {
        fallbackId: row.id,
        fallbackCreatedAt: row.created_at,
      });
      if (!contribution) return null;
      return {
        id: row.id,
        createdAt: row.created_at,
        contribution: {
          ...contribution,
          id: contribution.id || row.id,
          createdAt: contribution.createdAt || row.created_at,
        },
      };
    })
    .filter(Boolean);
}

export async function updateTreeSubmissionStatus(
  submissionId: string,
  status: TreeModerationStatus,
  moderator = "tree-admin",
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select("id,payload,created_at")
    .eq("id", submissionId)
    .eq("form_type", TREE_OF_HOPE_FORM_TYPE)
    .single();

  if (error || !data) throw new Error(error?.message || "Tree submission not found");

  const row = data as TreeSubmissionRow;
  const contribution = cleanTreeContribution(row.payload, {
    fallbackId: row.id,
    fallbackCreatedAt: row.created_at,
  });
  if (!contribution) throw new Error("Tree submission payload is invalid");

  const nextPayload = {
    ...contribution,
    moderationStatus: status,
    moderatedAt: new Date().toISOString(),
    moderatedBy: moderator,
  };

  const { error: updateError } = await supabase
    .from("form_submissions")
    .update({
      payload: nextPayload,
      subject: `Tree of Hope - ${treeZoneLabel(contribution.zoneId)} - ${status}`,
    })
    .eq("id", submissionId)
    .eq("form_type", TREE_OF_HOPE_FORM_TYPE);

  if (updateError) throw new Error(updateError.message);
  return nextPayload;
}
