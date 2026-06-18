"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-5 pt-20 pb-12 sm:px-6 sm:pt-28">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, var(--hero-glow-1) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, var(--hero-glow-2) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[900px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,6vw,4rem)] font-bold leading-tight tracking-tight mb-6 text-text-primary">
              Why Your Vote Matters
            </h1>
            <p className="mx-auto max-w-[800px] text-base leading-relaxed text-text-secondary md:text-lg">
              The Roots & Wings Community Awards celebrate the men who shape our communities — quietly, consistently, and with deep care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-[900px] space-y-12">
          {/* Section 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Recognition That Matters
            </h2>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-4">
              Across our communities, there are men who guide young people, support families, and demonstrate leadership in ways that are often unseen but deeply felt. They show up consistently. They care. They make a difference.
            </p>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed">
              The Roots & Wings Community Awards shine a light on these men and celebrate the positive influence they bring to our families and communities.
            </p>
          </motion.div>

          {/* Section 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Why Your Voice Is Needed
            </h2>
            <div className="space-y-4">
              <div className="bg-accent/10 border-l-4 border-accent p-6 rounded">
                <h3 className="text-xl font-bold text-accent mb-2">👨‍👧‍👦 Fathers & Mentors</h3>
                <p className="text-text-secondary">
                  Many fathers mentor young people without recognition. Your vote ensures their dedication is celebrated.
                </p>
              </div>

              <div className="bg-accent/10 border-l-4 border-accent p-6 rounded">
                <h3 className="text-xl font-bold text-accent mb-2">💪 Everyday Heroes</h3>
                <p className="text-text-secondary">
                  The men who show up every day, provide support, and demonstrate leadership deserve to be seen.
                </p>
              </div>

              <div className="bg-accent/10 border-l-4 border-accent p-6 rounded">
                <h3 className="text-xl font-bold text-accent mb-2">🌱 Role Models</h3>
                <p className="text-text-secondary">
                  Young men who lead with integrity inspire the next generation. Your vote recognises their influence.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Section 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Impact Across Generations
            </h2>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-4">
              Last year, over 250 people gathered to celebrate fathers, families, and community leadership. This year, we&apos;re building on that tradition.
            </p>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed">
              When you vote, you&apos;re not just nominating a person — you&apos;re acknowledging the ripple effect of their influence across three generations: the men before them, the men they are today, and the young people they inspire tomorrow.
            </p>
          </motion.div>

          {/* Section 4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              How Your Vote Counts
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-warm text-[#21180d] rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-1">Nominate</h3>
                  <p className="text-text-secondary">Tell us who deserves recognition and why they matter to your community.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-warm text-[#21180d] rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-1">Celebrate</h3>
                  <p className="text-text-secondary">Winners are announced at the Roots & Wings Family Fun Day on June 20th, 2026.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-warm text-[#21180d] rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-1">Inspire</h3>
                  <p className="text-text-secondary">Their recognition inspires others to show up, care, and lead in our communities.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-r from-[#21180d] via-[#2f3a16] to-[#0f1c0a] text-white rounded-lg p-8 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-base md:text-lg mb-8">
              Take 30 seconds to nominate the men who deserve recognition in our community.
            </p>
            <Link href="/vote">
              <button className="bg-accent-warm hover:bg-[#f2a43a] text-[#21180d] font-bold py-4 px-8 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg">
                Cast Your Vote Now
              </button>
            </Link>
          </motion.div>

          {/* Closing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-white rounded-lg p-8 border-2 border-accent text-center"
          >
            <p className="text-lg md:text-xl font-semibold text-text-primary leading-relaxed">
              Every vote is a chance to recognise a man who is making a difference.
            </p>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed mt-4">
              Help us celebrate the fathers, mentors and role models shaping our communities. Together we honour the influence that often goes unseen but never goes unfelt.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
