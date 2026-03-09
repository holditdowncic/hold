"use client";


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
