import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FORM_SUBMISSIONS_BUCKET = "form-submissions";

type SupabaseStorageBucketClient = {
  storage: {
    createBucket: (
      id: string,
      options: { public: boolean }
    ) => Promise<{ error: { message?: string } | null }>;
  };
};

export type FormSubmissionInput = {
  formType: string;
  sourcePath: string;
  payload: unknown;
  request: NextRequest;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  subject?: string | null;
};

export type FormSubmissionSaveResult = {
  saved: boolean;
  backend?: "table" | "storage";
  id?: string;
  path?: string;
  error?: string;
};

function normalizeText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getRequestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function toJsonSafePayload(payload: unknown): unknown {
  if (payload === undefined) return {};
  return JSON.parse(JSON.stringify(payload));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "submission";
}

async function ensurePrivateBucket(supabase: SupabaseStorageBucketClient) {
  const { error } = await supabase.storage.createBucket(FORM_SUBMISSIONS_BUCKET, {
    public: false,
  });

  if (
    error &&
    !/already exists|Duplicate/i.test(error.message || "")
  ) {
    throw error;
  }
}

export async function saveFormSubmission(
  input: FormSubmissionInput
): Promise<FormSubmissionSaveResult> {
  if (!supabaseServiceKey) {
    console.error("Form submission persistence skipped: SUPABASE_SERVICE_ROLE_KEY missing");
    return { saved: false, error: "SUPABASE_SERVICE_ROLE_KEY missing" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const record = {
    id,
    form_type: input.formType,
    source_path: input.sourcePath,
    contact_name: normalizeText(input.contactName),
    contact_email: normalizeText(input.contactEmail)?.toLowerCase() ?? null,
    contact_phone: normalizeText(input.contactPhone),
    subject: normalizeText(input.subject),
    payload: toJsonSafePayload(input.payload),
    ip_address: getRequestIp(input.request),
    user_agent: input.request.headers.get("user-agent") || "",
    created_at: createdAt,
  };

  const { error: tableError } = await supabase
    .from("form_submissions")
    .insert(record);

  if (!tableError) {
    return { saved: true, backend: "table", id };
  }

  console.error("form_submissions table insert failed, falling back to storage:", tableError.message);

  const objectPath = [
    slugify(input.formType),
    createdAt.slice(0, 10),
    `${createdAt.replace(/[:.]/g, "-")}-${id}.json`,
  ].join("/");

  const filePayload = {
    ...record,
    table_insert_error: tableError.message,
  };

  let { error: uploadError } = await supabase.storage
    .from(FORM_SUBMISSIONS_BUCKET)
    .upload(objectPath, JSON.stringify(filePayload, null, 2), {
      contentType: "application/json",
      upsert: false,
    });

  if (uploadError && /bucket not found|not found/i.test(uploadError.message || "")) {
    try {
      await ensurePrivateBucket(supabase);
      const retry = await supabase.storage
        .from(FORM_SUBMISSIONS_BUCKET)
        .upload(objectPath, JSON.stringify(filePayload, null, 2), {
          contentType: "application/json",
          upsert: false,
        });
      uploadError = retry.error;
    } catch (bucketError) {
      const message =
        bucketError instanceof Error ? bucketError.message : String(bucketError);
      console.error("Form submission bucket creation failed:", message);
      return { saved: false, id, error: message };
    }
  }

  if (uploadError) {
    console.error("Form submission storage upload failed:", uploadError.message);
    return { saved: false, id, error: uploadError.message };
  }

  return { saved: true, backend: "storage", id, path: objectPath };
}
