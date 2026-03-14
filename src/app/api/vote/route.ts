import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { categories, categoryLabels, VOTING_DEADLINE } from "@/data/categories";
import { buildVoteResultsSummary } from "@/lib/vote-results";

const supabaseUrl = process.env.SUPABASE_URL || 'https://krqghaxflwyxwcapbedf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const requiredCategoryKeys = categories.map((c) => c.key);

async function notifyVoteChannels({
  email,
  votes,
  companies,
  categoryReasons,
  reason,
  supabase,
}: {
  email: string;
  votes: Record<string, string>;
  companies?: Record<string, string>;
  categoryReasons?: Record<string, string>;
  reason?: string;
  supabase: SupabaseClient;
}) {
  const openclawToken = process.env.OPENCLAW_BOT_TOKEN;
  const openclawChatId = process.env.OPENCLAW_CHAT_ID;
  const openclawWebhookUrl = process.env.OPENCLAW_WEBHOOK_URL;
  const openclawWebhookToken = process.env.OPENCLAW_WEBHOOK_TOKEN;

  const nomineeLines = requiredCategoryKeys
    .map((cat) => {
      let line = `• <b>${categoryLabels[cat] || cat}:</b> ${votes[cat].trim()}`;
      if (companies?.[cat]?.trim()) {
        line += ` (${companies[cat].trim()})`;
      }
      if (categoryReasons?.[cat]?.trim()) {
        line += `\n  💬 ${categoryReasons[cat].trim()}`;
      }
      return line;
    })
    .join("\n");

  const telegramMessage = [
    `🗳️ <b>New Vote Submitted</b>`,
    ``,
    `<b>Email:</b> ${email}`,
    ``,
    nomineeLines,
    reason ? `\n<b>Overall Reason:</b> ${reason}` : "",
    ``,
    `<i>${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })}</i>`,
  ]
    .filter(Boolean)
    .join("\n");

  const [votesResult, verificationsResult] = await Promise.all([
    supabase.from("votes").select("category_key, nominee_name, voter_email, created_at"),
    supabase.from("voter_verifications").select("email, voted_at, created_at"),
  ]);

  if (votesResult.error) {
    console.error("Vote notification summary query error:", votesResult.error);
  }

  if (verificationsResult.error) {
    console.error("Verification notification summary query error:", verificationsResult.error);
  }

  const voteSummary =
    votesResult.error || verificationsResult.error
      ? null
      : buildVoteResultsSummary(votesResult.data ?? [], verificationsResult.data ?? [], {
          nomineeLimit: 3,
        });

  const notifications: Promise<Response>[] = [];

  if (openclawToken && openclawChatId) {
    notifications.push(
      fetch(`https://api.telegram.org/bot${openclawToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: openclawChatId,
          text: telegramMessage,
          parse_mode: "HTML",
        }),
      }),
    );
  }

  if (openclawWebhookUrl) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (openclawWebhookToken) {
      headers.Authorization = `Bearer ${openclawWebhookToken}`;
    }

    notifications.push(
      fetch(openclawWebhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event: "vote.submitted",
          occurredAt: new Date().toISOString(),
          voterEmail: email.toLowerCase(),
          votes: requiredCategoryKeys.map((categoryKey) => ({
            categoryKey,
            categoryLabel: categoryLabels[categoryKey] || categoryKey,
            nomineeName: votes[categoryKey].trim(),
            nomineeCompany: companies?.[categoryKey]?.trim() || null,
            nomineeReason: categoryReasons?.[categoryKey]?.trim() || null,
          })),
          overallReason: reason || null,
          summary: voteSummary?.summary ?? null,
        }),
      }),
    );
  }

  if (notifications.length === 0) {
    return;
  }

  const results = await Promise.allSettled(notifications);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("OpenClaw notification error:", result.reason);
    }
  }
}

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

    const { votes, companies, categoryReasons, email, reason } = await request.json();
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
    for (const category of requiredCategoryKeys) {
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

    // Save all votes (now includes company and per-category reason)
    const voteRecords = requiredCategoryKeys.map((category) => ({
      category_key: category,
      nominee_name: votes[category].trim(),
      nominee_company: companies?.[category]?.trim() || null,
      nominee_reason: categoryReasons?.[category]?.trim() || null,
      voter_email: email.toLowerCase(),
      voter_ip: ip,
      voter_user_agent: userAgent,
      voter_reason: reason || null,
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

    // Send notifications without blocking the vote submission result.
    try {
      await notifyVoteChannels({
        email,
        votes,
        companies,
        categoryReasons,
        reason,
        supabase,
      });
    } catch (notifyErr) {
      console.error("OpenClaw notification error:", notifyErr);
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
