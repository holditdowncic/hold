import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { categories, categoryLabels, VOTING_DEADLINE } from "@/data/categories";


const supabaseUrl = process.env.SUPABASE_URL || 'https://krqghaxflwyxwcapbedf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const requiredCategoryKeys = categories.map((c) => c.key);

function buildTelegramMessage({
  email,
  votes,
  companies,
  categoryReasons,
  reason,
  dbOffline,
}: {
  email: string;
  votes: Record<string, string>;
  companies?: Record<string, string>;
  categoryReasons?: Record<string, string>;
  reason?: string;
  dbOffline?: boolean;
}) {
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

  return [
    dbOffline ? `🗳️ <b>New Vote Submitted</b> ⚠️ <i>[DB offline — needs manual entry]</i>` : `🗳️ <b>New Vote Submitted</b>`,
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

  const results = await Promise.allSettled(
    targets.map((target) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: target,
          text: message,
          parse_mode: "HTML",
        }),
      })
    )
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Telegram notification error:", result.reason);
    }
  }
}

async function notifyWebhook({
  email,
  votes,
  companies,
  categoryReasons,
  reason,
}: {
  email: string;
  votes: Record<string, string>;
  companies?: Record<string, string>;
  categoryReasons?: Record<string, string>;
  reason?: string;
}) {
  const webhookUrl = process.env.OPENCLAW_WEBHOOK_URL;
  const webhookToken = process.env.OPENCLAW_WEBHOOK_TOKEN;
  if (!webhookUrl) return;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (webhookToken) headers.Authorization = `Bearer ${webhookToken}`;

  try {
    await fetch(webhookUrl, {
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
      }),
    });
  } catch (err) {
    console.error("Webhook notification error:", err);
  }
}

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

    // Check if Supabase is reachable
    const dbAvailable = await checkSupabaseAvailable();

    if (dbAvailable) {
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

      // Check if IP has already voted
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
      }

      // Save votes (only columns that exist in the schema)
      const voteRecords = requiredCategoryKeys.map((category) => ({
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
        console.error("Vote insert error:", voteError);
      }

      // Build summary for webhook
      // Send notifications
      try {
        const msg = buildTelegramMessage({ email, votes, companies, categoryReasons, reason });
        await Promise.allSettled([
          sendTelegramNotification(msg),
          notifyWebhook({ email, votes, companies, categoryReasons, reason }),
        ]);
      } catch (notifyErr) {
        console.error("Notification error:", notifyErr);
      }
    } else {
      // DB is offline — send vote to Telegram as the record
      console.warn("Supabase unreachable, recording vote via Telegram only");
      const msg = buildTelegramMessage({ email, votes, companies, categoryReasons, reason, dbOffline: true });
      await sendTelegramNotification(msg);
      await notifyWebhook({ email, votes, companies, categoryReasons, reason });
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
