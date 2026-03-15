/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { notifyOpsChannels } from "@/lib/ops-notify";
import { getStripeServer } from "@/lib/stripe";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL || "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

type StripeReference = string | { id: string } | null | undefined;

function getStripeId(value: StripeReference): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function getStripeTimestamp(value?: number | null): string | null {
  return value ? new Date(value * 1000).toISOString() : null;
}

function formatAmount(currency: string | null, amount: number | null): string {
  if (!currency || amount === null || amount === undefined) return "unknown";
  return `${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;
}

async function upsertCheckoutDonation(
  supabase: any,
  session: Stripe.Checkout.Session,
  eventType: string,
  status: "completed" | "pending" | "failed",
) {
  const amountTotal = typeof session.amount_total === "number" ? session.amount_total : null;
  const amountSubtotal = typeof session.amount_subtotal === "number" ? session.amount_subtotal : null;
  const customerName = session.customer_details?.name || session.customer_details?.email || null;
  const customerEmail = session.customer_details?.email || session.customer_email || null;

  const { error } = await supabase.from("donations").upsert(
    {
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: getStripeId(session.payment_intent),
      stripe_customer_id: getStripeId(session.customer),
      stripe_payment_link_id: getStripeId(session.payment_link),
      status,
      livemode: session.livemode,
      currency: session.currency || null,
      amount_total: amountTotal,
      amount_subtotal: amountSubtotal,
      amount_refunded: 0,
      customer_name: customerName,
      customer_email: customerEmail,
      donor_message: session.metadata?.donor_message || null,
      last_event_type: eventType,
      paid_at: getStripeTimestamp(session.created),
      raw_event: session as unknown as Record<string, unknown>,
      metadata: session.metadata || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_checkout_session_id" },
  );

  if (error) throw error;

  return {
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: getStripeId(session.payment_intent),
    customerEmail,
    customerName,
    amountTotal,
    currency: session.currency || null,
    paymentLinkId: getStripeId(session.payment_link),
  };
}

async function markRefundedDonation(
  supabase: any,
  charge: Stripe.Charge,
  eventType: string,
) {
  const paymentIntentId = getStripeId(charge.payment_intent);
  const updateValues = {
    stripe_charge_id: charge.id,
    status: charge.refunded ? "refunded" : "completed",
    amount_refunded: typeof charge.amount_refunded === "number" ? charge.amount_refunded : 0,
    refunded_at: charge.refunded ? getStripeTimestamp(charge.created) : null,
    customer_email: charge.billing_details?.email || charge.receipt_email || null,
    customer_name: charge.billing_details?.name || null,
    currency: charge.currency || null,
    amount_total: typeof charge.amount === "number" ? charge.amount : null,
    last_event_type: eventType,
    raw_event: charge as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  };

  let query = supabase.from("donations").update(updateValues);
  if (paymentIntentId) {
    query = query.eq("stripe_payment_intent_id", paymentIntentId);
  } else {
    query = query.eq("stripe_charge_id", charge.id);
  }

  const { data, error } = await query.select("id").limit(1);
  if (error) throw error;

  if (!data || data.length === 0) {
    const { error: insertError } = await supabase.from("donations").insert({
      stripe_checkout_session_id: null,
      stripe_payment_intent_id: paymentIntentId,
      stripe_charge_id: charge.id,
      status: charge.refunded ? "refunded" : "completed",
      livemode: charge.livemode,
      currency: charge.currency || null,
      amount_total: typeof charge.amount === "number" ? charge.amount : null,
      amount_subtotal: null,
      amount_refunded: typeof charge.amount_refunded === "number" ? charge.amount_refunded : 0,
      customer_name: charge.billing_details?.name || null,
      customer_email: charge.billing_details?.email || charge.receipt_email || null,
      donor_message: null,
      last_event_type: eventType,
      paid_at: getStripeTimestamp(charge.created),
      refunded_at: charge.refunded ? getStripeTimestamp(charge.created) : null,
      raw_event: charge as unknown as Record<string, unknown>,
      metadata: {},
      updated_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;
  }

  return {
    stripeChargeId: charge.id,
    stripePaymentIntentId: paymentIntentId,
    customerEmail: charge.billing_details?.email || charge.receipt_email || null,
    amountTotal: typeof charge.amount === "number" ? charge.amount : null,
    amountRefunded: typeof charge.amount_refunded === "number" ? charge.amount_refunded : 0,
    currency: charge.currency || null,
  };
}

export async function POST(request: NextRequest) {
  const stripe = getStripeServer();
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured. Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET." },
      { status: 503 },
    );
  }

  if (!supabaseServiceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const status =
          event.type === "checkout.session.async_payment_failed"
            ? "failed"
            : session.payment_status === "paid"
              ? "completed"
              : "pending";

        const result = await upsertCheckoutDonation(supabase, session, event.type, status);

        await notifyOpsChannels({
          event: `stripe.${event.type}`,
          text: [
            `Stripe donation update`,
            `Event: ${event.type}`,
            `Status: ${status}`,
            `Amount: ${formatAmount(result.currency, result.amountTotal)}`,
            result.customerEmail ? `Email: ${result.customerEmail}` : null,
            result.customerName ? `Name: ${result.customerName}` : null,
            result.stripeCheckoutSessionId ? `Checkout session: ${result.stripeCheckoutSessionId}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          payload: {
            stripeEventId: event.id,
            stripeEventType: event.type,
            ...result,
          },
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const result = await markRefundedDonation(supabase, charge, event.type);

        await notifyOpsChannels({
          event: `stripe.${event.type}`,
          text: [
            `Stripe refund update`,
            `Event: ${event.type}`,
            `Refunded: ${formatAmount(result.currency, result.amountRefunded)}`,
            `Original amount: ${formatAmount(result.currency, result.amountTotal)}`,
            result.customerEmail ? `Email: ${result.customerEmail}` : null,
            result.stripeChargeId ? `Charge: ${result.stripeChargeId}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          payload: {
            stripeEventId: event.id,
            stripeEventType: event.type,
            ...result,
          },
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe webhook handling failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
