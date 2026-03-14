import type { Metadata } from "next";
import PolicyPage from "@/components/legal/PolicyPage";
import { siteUrl, termsContent } from "@/data/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: termsContent.description,
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
};

export default function TermsPage() {
  return <PolicyPage content={termsContent} />;
}
