import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || 'https://krqghaxflwyxwcapbedf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VOTING_DEADLINE = new Date("2026-05-16T23:59:59");

export async function POST(request: NextRequest) {
  try {
    // Check deadline
    const now = new Date();
    if (now > VOTING_DEADLINE) {
      return NextResponse.json(
        { error: "Voting has closed. The deadline was May 16th, 2026." },
        { status: 403 }
      );
    }

    const { votes, email } = await request.json();
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "";

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required." },
        { status: 400 }
      );
    }

    // Validate votes
    const requiredCategories = [
      "community_father",
      "everyday_hero",
      "mentor_year",
      "resilient_man",
      "always_there",
      "young_role_model",
    ];

    for (const category of requiredCategories) {
      if (!votes[category] || !votes[category].trim()) {
        return NextResponse.json(
          { error: `Please enter a nominee for all categories.` },
          { status: 400 }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email has already voted
    const { data: existingVoter } = await supabase
      .from("voter_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (existingVoter) {
      return NextResponse.json(
        { error: "This email has already submitted votes." },
        { status: 409 }
      );
    }

    // Check if IP has already voted (optional - can be strict)
    const { data: existingIp } = await supabase
      .from("voter_verifications")
      .select("*")
      .eq("ip_address", ip)
      .single();

    if (existingIp) {
      return NextResponse.json(
        { error: "A vote has already been submitted from this device." },
        { status: 409 }
      );
    }

    // Create voter verification record
    const { error: verificationError } = await supabase
      .from("voter_verifications")
      .insert({
        email: email.toLowerCase(),
        ip_address: ip,
        is_verified: true,
        voted_at: new Date().toISOString(),
      });

    if (verificationError) {
      console.error("Verification error:", verificationError);
      return NextResponse.json(
        { error: "Failed to record vote. Please try again." },
        { status: 500 }
      );
    }

    // Save all votes
    const voteRecords = requiredCategories.map((category) => ({
      category_key: category,
      nominee_name: votes[category].trim(),
      voter_email: email.toLowerCase(),
      voter_ip: ip,
      voter_user_agent: userAgent,
    }));

    const { error: voteError } = await supabase
      .from("votes")
      .insert(voteRecords);

    if (voteError) {
      console.error("Vote error:", voteError);
      return NextResponse.json(
        { error: "Failed to save votes. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Votes submitted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
