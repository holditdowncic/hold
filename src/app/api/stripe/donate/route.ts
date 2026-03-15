import { NextRequest, NextResponse } from "next/server";
import { getDonationCurrency, getDonationMinAmountPence, getStripeServer } from "@/lib/stripe";

type DonateRequest = {
  amount?: number;
  donorName?: string;
  donorEmail?: string;
  message?: string;
};

function getBaseUrl(request: NextRequest): string {
  const siteUrl = process.env.SITE_URL?.trim();
  if (siteUrl) return siteUrl.replace(/\/$/, "");
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY to the environment first." },
      { status: 503 }
    );
  }

  let body: DonateRequest;
  try {
    body = (await request.json()) as DonateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount || 0));
  const minAmount = getDonationMinAmountPence();
  if (!Number.isFinite(amount) || amount < minAmount) {
    return NextResponse.json(
      { error: `Donation amount must be at least ${(minAmount / 100).toFixed(2)} GBP.` },
      { status: 400 }
    );
  }

  const donorName = String(body.donorName || "").trim().slice(0, 120);
  const donorEmail = String(body.donorEmail || "").trim().slice(0, 320);
  const message = String(body.message || "").trim().slice(0, 500);
  const baseUrl = getBaseUrl(request);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/donate/cancel`,
      billing_address_collection: "auto",
      customer_email: donorEmail || undefined,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: getDonationCurrency(),
            unit_amount: amount,
            product_data: {
              name: "Donation to Hold It Down CIC",
              description: "Supports mentoring, youth programmes, family support, and community activity in South London.",
            },
          },
        },
      ],
      metadata: {
        flow: "website_donation",
        donor_name: donorName,
        donor_email: donorEmail,
        donor_message: message,
      },
      payment_intent_data: {
        metadata: {
          flow: "website_donation",
          donor_name: donorName,
          donor_email: donorEmail,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Stripe checkout session creation failed.";
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
