import type { Metadata } from "next";
import DonatePage from "@/components/DonatePage";
import { siteUrl } from "@/data/legal";
import { getDonationMinAmountPence, getSuggestedDonationAmountsPence } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Donate securely to Hold It Down CIC via Stripe to support youth mentoring, family support, events, and community programmes in South London.",
  alternates: {
    canonical: `${siteUrl}/donate`,
  },
};

export default function DonateRoutePage() {
  return (
    <DonatePage
      paymentLinkUrl={process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK_URL || null}
      suggestedAmounts={getSuggestedDonationAmountsPence().map((value) => value / 100)}
      minimumAmount={getDonationMinAmountPence() / 100}
    />
  );
}
