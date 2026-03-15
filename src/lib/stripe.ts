import Stripe from "stripe";

let stripeClient: Stripe | null | undefined;

export function getStripeServer(): Stripe | null {
  if (stripeClient !== undefined) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    stripeClient = null;
    return stripeClient;
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function getDonationCurrency(): string {
  return (process.env.STRIPE_CURRENCY || "gbp").toLowerCase();
}

export function getDonationMinAmountPence(): number {
  const parsed = Number(process.env.STRIPE_DONATION_MIN_AMOUNT_GBP || "5");
  const pounds = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  return Math.round(pounds * 100);
}

export function getSuggestedDonationAmountsPence(): number[] {
  const parsed = String(process.env.STRIPE_DONATION_SUGGESTED_AMOUNTS_GBP || "10,25,50,100")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.round(value * 100));

  return parsed.length ? parsed : [1000, 2500, 5000, 10000];
}
