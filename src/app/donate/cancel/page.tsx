import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { siteUrl } from "@/data/legal";

export const metadata: Metadata = {
  title: "Donation Cancelled",
  description: "Return to the Hold It Down CIC donation page.",
  alternates: {
    canonical: `${siteUrl}/donate/cancel`,
  },
};

export default function DonateCancelPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="px-5 pt-32 pb-16 sm:px-6 md:pb-24">
        <div className="mx-auto max-w-[760px] rounded-3xl border border-border bg-bg-card p-8 text-center sm:p-12">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl">
            Donation not completed.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-secondary">
            No payment was taken. You can return to the donation page, choose a different amount, or contact the team
            if you ran into an issue.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/donate"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Try again
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border-hover px-6 py-3 text-sm font-semibold text-text-primary transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent/5"
            >
              Contact support
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
