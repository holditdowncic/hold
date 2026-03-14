import type { Metadata } from "next";
import PolicyPage from "@/components/legal/PolicyPage";
import { privacyPolicyContent, siteUrl } from "@/data/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: privacyPolicyContent.description,
  alternates: {
    canonical: `${siteUrl}/privacy-policy`,
  },
};

export default function PrivacyPolicyPage() {
  return <PolicyPage content={privacyPolicyContent} />;
}
