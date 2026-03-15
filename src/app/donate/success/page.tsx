import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { siteUrl } from "@/data/legal";

export const metadata: Metadata = {
  title: "Donation Successful",
  description: "Thank you for supporting Hold It Down CIC.",
  alternates: {
    canonical: `${siteUrl}/donate/success`,
  },
};

export default function DonateSuccessPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="px-5 pt-32 pb-16 sm:px-6 md:pb-24">
        <div className="mx-auto max-w-[760px] rounded-3xl border border-border bg-bg-card p-8 text-center sm:p-12">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <h1 className="mt-6 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl">
            Thank you for your donation.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-secondary">
            Your contribution helps fund mentoring, events, practical support, and safe spaces for young people and
            families across South London.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Back to home
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border-hover px-6 py-3 text-sm font-semibold text-text-primary transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent/5"
            >
              Contact the team
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
