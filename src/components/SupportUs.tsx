"use client";

import { motion } from "framer-motion";
import { Reveal, fadeUp, staggerContainer } from "@/lib/motion";

const supportWays = [
  {
    title: "Donate",
    desc: "Support workshops, community spaces, and events that change lives. Every contribution helps us keep our programmes free and accessible.",
    cta: "Donate Now",
    href: "mailto:hollditdownuk@hotmail.com?subject=Donation%20Enquiry",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "Partner With Us",
    desc: "Collaborate with Hold It Down to strengthen community impact. We work with councils, charities, schools, businesses, and funders who share our vision.",
    cta: "Explore Partnerships",
    href: "mailto:hollditdownuk@hotmail.com?subject=Partnership%20Enquiry",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Volunteer",
    desc: "Give your time, skills, or lived experience. Help at events, mentor young people, facilitate workshops, or support behind the scenes.",
    cta: "Volunteer This Season",
    href: "mailto:hollditdownuk@hotmail.com?subject=Volunteer%20Enquiry",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    title: "In-Kind Support",
    desc: "Offer space, equipment, catering, printing, or professional expertise. Practical support makes a real difference to grassroots community work.",
    cta: "Offer Support",
    href: "mailto:hollditdownuk@hotmail.com?subject=In-Kind%20Support",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
];

export default function SupportUs() {
  return (
    <section id="support" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12 md:mb-16">
          <Reveal>
            <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Support Us
            </span>
          </Reveal>
          <Reveal>
            <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
              Help keep community spaces{" "}
              <span className="text-gradient">free & open</span>
            </h2>
          </Reveal>
          <Reveal>
            <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg">
              Hold It Down is powered by people who believe in grassroots change.
              There are many ways to support our work &mdash; every contribution
              makes a real difference.
            </p>
          </Reveal>
        </div>

        {/* Support Cards */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 sm:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {supportWays.map((s) => (
            <motion.a
              key={s.title}
              href={s.href}
              variants={fadeUp}
              className="group flex gap-5 rounded-2xl border border-border bg-bg-card p-6 transition-[border-color,box-shadow] duration-300 hover:border-accent/30 hover:shadow-lg sm:p-8"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-accent-glow text-accent transition-colors group-hover:bg-accent/15">
                {s.icon}
              </div>
              <div>
                <h3 className="mb-2 font-[family-name:var(--font-heading)] text-lg font-semibold">
                  {s.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-text-secondary">
                  {s.desc}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors group-hover:text-accent-warm">
                  {s.cta}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-0.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
