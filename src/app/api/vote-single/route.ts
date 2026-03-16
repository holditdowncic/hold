import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { categoryLabels, VOTING_DEADLINE } from "@/data/categories";

const supabaseUrl = process.env.SUPABASE_URL || "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    const { categoryKey, nomineeName, nomineeCompany, nomineeReason, email, reason } =
      await request.json();

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "";

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required." },
        { status: 400 }
      );
    }

    // Validate category
    if (!categoryKey || !categoryLabels[categoryKey]) {
      return NextResponse.json(
        { error: "Please select a valid award category." },
        { status: 400 }
      );
    }

    // Validate nominee
    if (!nomineeName || !nomineeName.trim()) {
      return NextResponse.json(
        { error: "Please enter a nominee name." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this email has already voted (in any capacity — single or full)
    const { data: existingVoter } = await supabase
      .from("voter_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (existingVoter) {
      return NextResponse.json(
        { error: "This email has already been used to cast a vote." },
        { status: 409 }
      );
    }

    // Check IP (one vote per device)
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

    // Record voter verification
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

    // Save the single vote
    const { error: voteError } = await supabase.from("votes").insert({
      category_key: categoryKey,
      nominee_name: nomineeName.trim(),
      nominee_company: nomineeCompany?.trim() || null,
      nominee_reason: nomineeReason?.trim() || null,
      voter_email: email.toLowerCase(),
      voter_ip: ip,
      voter_user_agent: userAgent,
      voter_reason: reason || null,
    });

    if (voteError) {
      console.error("Vote error:", voteError);
      return NextResponse.json(
        { error: "Failed to save vote. Please try again." },
        { status: 500 }
      );
    }

    // Notify via Telegram / webhook
    try {
      const openclawToken = process.env.OPENCLAW_BOT_TOKEN;
      const openclawChatId = process.env.OPENCLAW_CHAT_ID;
      const openclawWebhookUrl = process.env.OPENCLAW_WEBHOOK_URL;
      const openclawWebhookToken = process.env.OPENCLAW_WEBHOOK_TOKEN;

      const telegramMessage = [
        `🗳️ <b>New Single-Category Vote</b>`,
        ``,
        `<b>Email:</b> ${email}`,
        `<b>Category:</b> ${categoryLabels[categoryKey]}`,
        `<b>Nominee:</b> ${nomineeName.trim()}${nomineeCompany?.trim() ? ` (${nomineeCompany.trim()})` : ""}`,
        nomineeReason?.trim() ? `💬 ${nomineeReason.trim()}` : "",
        reason ? `<b>Overall reason:</b> ${reason}` : "",
        ``,
        `<i>${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })}</i>`,
      ]
        .filter(Boolean)
        .join("\n");

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
          })
        );
      }

      if (openclawWebhookUrl) {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (openclawWebhookToken) headers.Authorization = `Bearer ${openclawWebhookToken}`;
        notifications.push(
          fetch(openclawWebhookUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({
              event: "vote.single.submitted",
              occurredAt: new Date().toISOString(),
              voterEmail: email.toLowerCase(),
              categoryKey,
              categoryLabel: categoryLabels[categoryKey],
              nomineeName: nomineeName.trim(),
              nomineeCompany: nomineeCompany?.trim() || null,
              nomineeReason: nomineeReason?.trim() || null,
              overallReason: reason || null,
            }),
          })
        );
      }

      await Promise.allSettled(notifications);
    } catch (notifyErr) {
      console.error("Notification error:", notifyErr);
    }

    return NextResponse.json({ message: "Vote submitted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Vote single API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
