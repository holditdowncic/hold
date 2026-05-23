import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { categoryLabels, VOTING_DEADLINE } from "@/data/categories";

const supabaseUrl = process.env.SUPABASE_URL || "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkSupabaseAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      signal: controller.signal,
      headers: { apikey: supabaseServiceKey },
    });
    clearTimeout(timeout);
    return res.ok || res.status === 401 || res.status === 403;
  } catch {
    return false;
  }
}

async function sendTelegramNotification(message: string) {
  const token = process.env.OPENCLAW_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.OPENCLAW_CHAT_ID;
  const adminIds = process.env.TELEGRAM_ADMIN_IDS;

  const targets: string[] = [];
  if (chatId) targets.push(chatId);
  if (!chatId && adminIds) {
    targets.push(...adminIds.split(",").map((id) => id.trim()).filter(Boolean));
  }

  if (!token || targets.length === 0) return;

  await Promise.allSettled(
    targets.map((target) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: target, text: message, parse_mode: "HTML" }),
      })
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check deadline
    const now = new Date();
    if (now > VOTING_DEADLINE) {
      return NextResponse.json(
        { error: "Voting has closed. The deadline was 17 June 2026." },
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

    const dbAvailable = await checkSupabaseAvailable();

    if (dbAvailable) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Check if this email has already voted
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

      // Check IP
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
      }

      // Save the single vote (only columns that exist in the schema)
      const { error: voteError } = await supabase.from("votes").insert({
        category_key: categoryKey,
        nominee_name: nomineeName.trim(),
        voter_email: email.toLowerCase(),
        voter_ip: ip,
        voter_user_agent: userAgent,
      });

      if (voteError) {
        console.error("Vote insert error:", voteError);
      }
    } else {
      console.warn("Supabase unreachable, recording single vote via Telegram only");
    }

    // Always send Telegram notification (serves as backup when DB is down)
    const telegramMessage = [
      dbAvailable
        ? `🗳️ <b>New Single-Category Vote</b>`
        : `🗳️ <b>New Single-Category Vote</b> ⚠️ <i>[DB offline — needs manual entry]</i>`,
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

    try {
      const webhookUrl = process.env.OPENCLAW_WEBHOOK_URL;
      const webhookToken = process.env.OPENCLAW_WEBHOOK_TOKEN;

      const notifications: Promise<void | Response>[] = [sendTelegramNotification(telegramMessage)];

      if (webhookUrl) {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (webhookToken) headers.Authorization = `Bearer ${webhookToken}`;
        notifications.push(
          fetch(webhookUrl, {
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
