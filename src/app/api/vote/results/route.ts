import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildVoteResultsSummary } from "@/lib/vote-results";

const supabaseUrl = process.env.SUPABASE_URL || "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const voteResultsApiKey = process.env.VOTE_RESULTS_API_KEY || process.env.CMS_API_SECRET;

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-api-key")?.trim() || null;
}

export async function GET(request: NextRequest) {
  if (!supabaseServiceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 500 },
    );
  }

  if (!voteResultsApiKey) {
    return NextResponse.json(
      { error: "VOTE_RESULTS_API_KEY is not configured." },
      { status: 500 },
    );
  }

  if (getBearerToken(request) !== voteResultsApiKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const categoryFilter = searchParams.get("category");
  const nomineeLimit = Number.parseInt(searchParams.get("limit") || "5", 10);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const [{ data: votes, error: votesError }, { data: verifications, error: verificationsError }] =
    await Promise.all([
      supabase
        .from("votes")
        .select("category_key, nominee_name, voter_email, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("voter_verifications")
        .select("email, voted_at, created_at")
        .order("created_at", { ascending: false }),
    ]);

  if (votesError) {
    console.error("Vote results query error:", votesError);
    return NextResponse.json({ error: "Failed to load vote results." }, { status: 500 });
  }

  if (verificationsError) {
    console.error("Voter verification query error:", verificationsError);
    return NextResponse.json(
      { error: "Failed to load voter verification results." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    buildVoteResultsSummary(votes ?? [], verifications ?? [], {
      categoryFilter,
      nomineeLimit: Number.isFinite(nomineeLimit) ? nomineeLimit : 5,
    }),
  );
}
