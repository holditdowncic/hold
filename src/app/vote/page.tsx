"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VoteHero from "@/components/vote/VoteHero";
import CredibilityBanner from "@/components/vote/CredibilityBanner";
import WhyItMatters from "@/components/vote/WhyItMatters";
import ThemeBanner from "@/components/vote/ThemeBanner";
import AwardCategories from "@/components/vote/AwardCategories";
import CastYourVote from "@/components/vote/CastYourVote";
import VotingForm from "@/components/vote/VotingForm";
import EventAnnouncement from "@/components/vote/EventAnnouncement";
import ShareSection from "@/components/vote/ShareSection";
import ClosingStatement from "@/components/vote/ClosingStatement";
import { useVoteForm } from "@/lib/useVoteForm";

export default function VotePage() {
  const form = useVoteForm();

  return (
    <div className="min-h-screen">
      <Navbar />
      <VoteHero />

      {/* Individual voter callout */}
      <section className="px-5 pb-2 sm:px-6">
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">Voting as an individual?</p>
              <p className="text-xs text-text-tertiary">This page is for organisations voting across all 6 categories. Individuals can vote in one category instead.</p>
            </div>
            <Link
              href="/vote/single"
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-warm px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Vote in one category →
            </Link>
          </div>
        </div>
      </section>

      <CredibilityBanner />
      <WhyItMatters />
      <ThemeBanner />
      <AwardCategories />
      <CastYourVote />
      <VotingForm form={form} />
      <EventAnnouncement />
      <ShareSection />
      <ClosingStatement />
      <Footer />
    </div>
  );
}
