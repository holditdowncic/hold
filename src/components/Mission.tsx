"use client";

import { motion } from "framer-motion";
import type { MissionContent, MissionValue } from "@/lib/types";
import { Reveal, staggerContainer, TiltCard } from "@/lib/motion";

function Icon({ name }: { name: string }) {
  switch (name) {
    case "users":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "clock":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "eye":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "heart":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    default:
      return null;
  }
}

const fallback: MissionContent = {
  pill: "Our Mission",
  heading_line1: "I can because you can",
  heading_line2_prefix: "and together",
  heading_line2_highlight: "we can",
  description:
    "We meet young people where they are — not to control behaviour, but to heal the root causes of disconnection by affirming identity, restoring dignity, and creating spaces of belonging.",
  values: [
    {
      num: "01",
      title: "Who We Serve",
      desc: "Young people aged 12–25, particularly those who have experienced the justice system, exclusion from school, or systemic disadvantage. We also work closely with families — mothers, fathers and carers — recognising that long-term transformation requires intergenerational healing.",
      icon: "users",
    },
    {
      num: "02",
      title: "Strategic Aim",
      desc: "To reduce disconnection and exclusion by co-producing emotionally intelligent, culturally relevant support with young people, equipping them with the tools, networks, and healing spaces they need to re-engage with their families, communities, and futures.",
      icon: "clock",
    },
    {
      num: "03",
      title: "Our Vision",
      desc: "A world where young people, no matter their past, are empowered to lead their healing and shape their communities. We believe when young people recognise their potential and build resilience, they can transform their lives.",
      icon: "eye",
    },
    {
      num: "04",
      title: "Why It Matters",
      desc: "Founded in direct response to the unmet needs of young people in Croydon navigating exclusion, broken systems, and deep emotional wounds. Our programmes heal the root causes of disconnection by affirming identity, restoring dignity, and creating spaces of belonging.",
      icon: "heart",
    },
  ],
};

function safeValues(values: unknown): MissionValue[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((v) => v && typeof v === "object")
    .map((v) => v as MissionValue)
    .filter((v) => typeof v.num === "string" && typeof v.title === "string" && typeof v.desc === "string");
}

export default function Mission({ content }: { content: MissionContent | null }) {
  const c = content || fallback;
  const values = safeValues(c.values).length ? safeValues(c.values) : fallback.values;

  return (
    <section id="mission" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-14 md:mb-20">
          <Reveal>
            <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              {c.pill || fallback.pill}
            </span>
          </Reveal>
          <Reveal>
            <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
              {c.heading_line1 || fallback.heading_line1}
              <br />
              {(c.heading_line2_prefix || fallback.heading_line2_prefix) + " "}
              <span className="text-gradient">{c.heading_line2_highlight || fallback.heading_line2_highlight}</span>
            </h2>
          </Reveal>
          <Reveal>
            <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg">
              {c.description || fallback.description}
            </p>
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
              <div className="mb-5 text-accent">
                <Icon name={v.icon} />
              </div>
              <div className="mb-3.5 font-[family-name:var(--font-heading)] text-xs font-bold tracking-wider text-text-tertiary">
                {v.num}
              </div>
              <h3 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold">{v.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{v.desc}</p>
            </TiltCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

