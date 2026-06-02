import { NextRequest, NextResponse } from "next/server";
import { saveFormSubmission } from "@/lib/form-submissions";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const PAYMENT_LINKS: Record<string, { label: string; price: string; url: string }> = {
  community: {
    label: "Community Stall",
    price: "£25",
    url: "https://pay.sumup.com/b2c/QF47LUXV",
  },
  own_table: {
    label: "Standard Stall (own table)",
    price: "£40",
    url: "https://pay.sumup.com/b2c/QYJ2CJK2",
  },
  table_provided: {
    label: "Standard Stall (table provided)",
    price: "£60",
    url: "https://pay.sumup.com/b2c/Q8M282TJ",
  },
};

function getPaymentLink(stallType: string, table: string) {
  if (stallType === "community") return PAYMENT_LINKS.community;
  if (table === "yes") return PAYMENT_LINKS.own_table;
  if (table === "no") return PAYMENT_LINKS.table_provided;
  return null;
}

async function sendTelegram(chatId: string, text: string) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      console.error(`Telegram API error for ${chatId}:`, await response.text());
    }
  } catch (err) {
    console.error(`Telegram error for ${chatId}:`, err);
  }
}

function requiredString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const submission = {
      name: requiredString(data.name),
      business: requiredString(data.business),
      website: requiredString(data.website),
      products: requiredString(data.products),
      stallType: requiredString(data.stallType),
      electricity: requiredString(data.electricity),
      table: requiredString(data.table),
      email: requiredString(data.email).toLowerCase(),
      phone: requiredString(data.phone),
      requirements: requiredString(data.requirements),
    };

    if (
      !submission.name ||
      !submission.business ||
      !submission.products ||
      !submission.stallType ||
      !submission.electricity ||
      !submission.table ||
      !submission.email ||
      !submission.phone
    ) {
      return NextResponse.json({ error: "Required booking details are missing." }, { status: 400 });
    }

    if (!isValidEmail(submission.email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const paymentLink = getPaymentLink(submission.stallType, submission.table);

    const savedSubmission = await saveFormSubmission({
      formType: "stall-booking",
      sourcePath: "/stall-booking",
      payload: {
        ...submission,
        paymentLink,
      },
      request,
      contactName: submission.name,
      contactEmail: submission.email,
      contactPhone: submission.phone,
      subject: "Roots & Wings stall booking",
    });

    if (!savedSubmission.saved) {
      return NextResponse.json({ error: "Submission storage is temporarily unavailable." }, { status: 503 });
    }

    const telegramMessage = [
      `🧺 <b>New Stall Booking Request</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `<b>Name:</b> ${submission.name}`,
      `<b>Business/Organisation:</b> ${submission.business}`,
      submission.website ? `<b>Website/Social:</b> ${submission.website}` : null,
      `<b>Email:</b> ${submission.email}`,
      `<b>Phone:</b> ${submission.phone}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `<b>Products/Services:</b> ${submission.products}`,
      `<b>Stall Type:</b> ${submission.stallType}`,
      `<b>Electricity:</b> ${submission.electricity}`,
      `<b>Own Table:</b> ${submission.table}`,
      paymentLink ? `<b>Payment:</b> ${paymentLink.label} ${paymentLink.price}` : `<b>Payment:</b> Not calculated`,
      submission.requirements ? `<b>Requirements:</b> ${submission.requirements}` : null,
      `━━━━━━━━━━━━━━━━━━━━`,
      `<i>Submitted via holditdown.uk/stall-booking</i>`,
    ]
      .filter(Boolean)
      .join("\n");

    const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (adminIds.length === 0) {
      console.error("No TELEGRAM_ADMIN_IDS configured for stall booking notification");
    } else {
      await Promise.all(adminIds.map((id) => sendTelegram(id, telegramMessage)));
    }

    return NextResponse.json({ success: true, paymentLink });
  } catch (error) {
    console.error("Stall booking error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

