"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

type VoteMode = "idle" | "choosing" | "org";

export default function VotePage() {
  const form = useVoteForm();
  const [mode, setMode] = useState<VoteMode>("idle");
  const choiceRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleOpenChoices = () => {
    setMode("choosing");
    setTimeout(() => {
      choiceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleOrgVote = () => {
    setMode("org");
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <VoteHero />
      <CredibilityBanner />
      <WhyItMatters />
      <ThemeBanner />
      <AwardCategories />
      <CastYourVote onCastVote={handleOpenChoices} />

      {/* Choice panel */}
      <div ref={choiceRef}>
        <AnimatePresence>
          {(mode === "choosing" || mode === "org") && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.35 }}
              className="px-5 pb-16 sm:px-6"
            >
              <div className="mx-auto max-w-[700px]">
                <h3 className="text-center font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary mb-2">
                  How are you voting?
                </h3>
                <p className="text-center text-sm text-text-tertiary mb-8">
                  Choose the option that applies to you
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Individual */}
                  <Link
                    href="/vote/single"
                    className="group rounded-2xl border border-border bg-bg-card p-7 flex flex-col gap-4 transition-all hover:border-accent/40 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="text-4xl">🙋</div>
                    <div>
                      <p className="text-lg font-bold text-text-primary mb-1">Individual</p>
                      <p className="text-sm text-text-tertiary leading-relaxed">
                        Voting as a member of the public? Pick <strong>one category</strong> and nominate one person.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:gap-2.5 transition-all">
                      Vote in one category
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>

                  {/* Organisation */}
                  <button
                    onClick={handleOrgVote}
                    className="group text-left rounded-2xl border border-border bg-bg-card p-7 flex flex-col gap-4 transition-all hover:border-accent/40 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="text-4xl">🏢</div>
                    <div>
                      <p className="text-lg font-bold text-text-primary mb-1">Organisation</p>
                      <p className="text-sm text-text-tertiary leading-relaxed">
                        Voting on behalf of an organisation? Nominate someone across <strong>all 6 categories</strong>.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:gap-2.5 transition-all">
                      Vote in all 6 categories
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Org voting form — revealed after org choice */}
      <div ref={formRef}>
        {mode === "org" && <VotingForm form={form} />}
      </div>

      <EventAnnouncement />
      <ShareSection />
      <ClosingStatement />
      <Footer />
    </div>
  );
}
