import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveFormSubmission } from "@/lib/form-submissions";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const formType = "tree_of_hope_contribution";

type TreeContributionPayload = {
  id?: string;
  zoneId?: string;
  author?: string;
  message?: string;
  audioDataUrl?: string;
  audioType?: string;
  createdAt?: string;
  x?: number;
  y?: number;
};

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 1200) : fallback;
}

function cleanContribution(value: unknown): TreeContributionPayload | null {
  if (!value || typeof value !== "object") return null;

  const input = value as TreeContributionPayload;
  const message = cleanText(input.message);
  const audioDataUrl = typeof input.audioDataUrl === "string" && input.audioDataUrl.startsWith("data:audio/")
    ? input.audioDataUrl
    : undefined;

  if (!message && !audioDataUrl) return null;

  return {
    id: cleanText(input.id, crypto.randomUUID()).slice(0, 80),
    zoneId: cleanText(input.zoneId, "canopy").slice(0, 40),
    author: cleanText(input.author, "Community voice").slice(0, 80) || "Community voice",
    message,
    audioDataUrl,
    audioType: cleanText(input.audioType).slice(0, 80) || undefined,
    createdAt: cleanText(input.createdAt, new Date().toISOString()),
    x: typeof input.x === "number" ? input.x : undefined,
    y: typeof input.y === "number" ? input.y : undefined,
  };
}

export async function GET() {
  if (!supabaseServiceKey) {
    return NextResponse.json({ contributions: [] });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("form_submissions")
    .select("id,payload,created_at")
    .eq("form_type", formType)
    .order("created_at", { ascending: false })
    .limit(75);

  if (error) {
    console.error("Tree of Hope load failed:", error.message);
    return NextResponse.json({ contributions: [] });
  }

  const contributions = (data || [])
    .map((entry) => {
      const cleaned = cleanContribution(entry.payload);
      if (!cleaned) return null;
      return {
        ...cleaned,
        id: cleaned.id || entry.id,
        createdAt: cleaned.createdAt || entry.created_at,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ contributions });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contribution = cleanContribution(body);

    if (!contribution) {
      return NextResponse.json(
        { error: "Add a message or voice note before saving." },
        { status: 400 },
      );
    }

    const savedSubmission = await saveFormSubmission({
      formType,
      sourcePath: "/#tree-of-hope",
      payload: contribution,
      request,
      contactName: contribution.author,
      subject: `Tree of Hope - ${contribution.zoneId}`,
    });

    if (!savedSubmission.saved) {
      return NextResponse.json(
        { error: "Tree of Hope archive is temporarily unavailable." },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, contribution });
  } catch (error) {
    console.error("Tree of Hope save failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
