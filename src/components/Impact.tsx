"use client";

import { motion } from "framer-motion";
import { Reveal, staggerContainer, TiltCard } from "@/lib/motion";

const testimonials = [
  {
    quote:
      "Hold It Down gave my family a space where we could just be ourselves. My son found his voice through the workshops, and I found a community that truly understands us.",
    name: "Community Parent",
    role: "Roots & Wings Participant",
  },
  {
    quote:
      "For the first time, I felt like someone actually cared about what I had to say. The mentors here don\u2019t just talk at you \u2014 they listen, they understand, and they push you to believe in yourself.",
    name: "Young Person",
    role: "Youth Programme Member",
  },
  {
    quote:
      "This isn\u2019t charity \u2014 it\u2019s community. Hold It Down is built by people who\u2019ve lived it. That\u2019s what makes it real. That\u2019s what makes it work.",
    name: "Local Volunteer",
    role: "Community Member",
  },
];

export default function Impact() {
  return (
    <section id="impact" className="py-28 md:py-36">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <Reveal>
            <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Our Impact
            </span>
          </Reveal>
          <Reveal>
            <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
              Every story matters.
              <br />
              Every voice <span className="text-gradient">counts</span>.
            </h2>
          </Reveal>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid gap-6 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {testimonials.map((t, i) => (
            <TiltCard
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-card p-10 transition-all duration-500 hover:border-border-hover"
            >
              <span className="text-gradient mb-4 font-[family-name:var(--font-heading)] text-6xl leading-none">
                &ldquo;
              </span>
              <p className="flex-1 text-[0.95rem] italic leading-relaxed text-text-secondary">
                {t.quote}
              </p>
              <div className="mt-7 border-t border-border pt-5">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-text-tertiary">{t.role}</p>
              </div>
            </TiltCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
