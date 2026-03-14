import type { Metadata } from "next";
import PolicyPage from "@/components/legal/PolicyPage";
import { siteUrl, stripeVerificationContent } from "@/data/legal";

export const metadata: Metadata = {
  title: "Stripe Verification",
  description: stripeVerificationContent.description,
  alternates: {
    canonical: `${siteUrl}/stripe-verification`,
  },
};

export default function StripeVerificationPage() {
  return <PolicyPage content={stripeVerificationContent} />;
}
