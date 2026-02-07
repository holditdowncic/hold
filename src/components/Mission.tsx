"use client";

import { motion } from "framer-motion";
import { Reveal, fadeUp, staggerContainer, TiltCard } from "@/lib/motion";

const values = [
  {
    num: "01",
    title: "Empowerment",
    desc: "Improving the lives of young people by challenging them to become their best selves, fostering personal growth and resilience through safe, culturally affirming environments.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        <line x1="12" y1="2" x2="12" y2="4" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Opportunities",
    desc: "Creating meaningful activities that develop skills and confidence. We open doors through workshops, events, and programmes designed with and for the community.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Community",
    desc: "Encouraging young people to be a positive force in their communities, promoting active participation, social responsibility, and intergenerational connection.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Environment",
    desc: "Supporting young people in shaping the environment they live in, fostering a sense of ownership and pride in their communities and local spaces.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

export default function Mission() {
  return (
    <section id="mission" className="py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-14 md:mb-20">
          <Reveal>
            <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Our Mission
            </span>
          </Reveal>
          <Reveal>
            <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
              Connection, care, and courage &mdash;
              <br />
              not just values, but{" "}
              <span className="text-gradient">lived actions</span>
            </h2>
          </Reveal>
        </div>

        {/* Values Grid */}
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {values.map((v) => (
            <TiltCard
              key={v.num}
              className="card-shadow group relative overflow-hidden rounded-2xl border border-border bg-bg-card p-6 transition-all duration-500 sm:p-8 hover:border-border-hover hover:bg-bg-card-hover"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent-warm opacity-0 transition-opacity duration-400 group-hover:opacity-100" />
              <div className="mb-5 text-accent">{v.icon}</div>
              <div className="mb-3.5 font-[family-name:var(--font-heading)] text-xs font-bold tracking-wider text-text-tertiary">
                {v.num}
              </div>
              <h3 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold">
                {v.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {v.desc}
              </p>
            </TiltCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
