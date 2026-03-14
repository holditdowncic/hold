import type { Metadata } from "next";
import PolicyPage from "@/components/legal/PolicyPage";
import { refundPolicyContent, siteUrl } from "@/data/legal";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: refundPolicyContent.description,
  alternates: {
    canonical: `${siteUrl}/refund-policy`,
  },
};

export default function RefundPolicyPage() {
  return <PolicyPage content={refundPolicyContent} />;
}
