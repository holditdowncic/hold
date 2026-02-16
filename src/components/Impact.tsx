"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Reveal, staggerContainer, TiltCard } from "@/lib/motion";
import type { ImpactContent, ImpactTestimonial } from "@/lib/types";

const fallbackTestimonials: ImpactTestimonial[] = [
  {
    quote:
      "Hold It Down gave my family a space where we could just be ourselves. My son found his voice through the workshops, and I found a community that truly understands us.",
    name: "Community Parent",
    role: "Roots & Wings Participant",
    avatar:
      "/media/image-5.jpeg",
  },
  {
    quote:
      "For the first time, I felt like someone actually cared about what I had to say. The mentors here don\u2019t just talk at you \u2014 they listen, they understand, and they push you to believe in yourself.",
    name: "Young Person",
    role: "Youth Programme Member",
    avatar:
      "/media/image-7.jpeg",
  },
  {
    quote:
      "This isn\u2019t charity \u2014 it\u2019s community. Hold It Down is built by people who\u2019ve lived it. That\u2019s what makes it real. That\u2019s what makes it work.",
    name: "Local Volunteer",
    role: "Community Member",
    avatar:
      "/media/image-1.jpeg",
  },
];

const fallback: ImpactContent = {
  pill: "Our Impact",
  heading_line1: "Every story matters.",
  heading_line2_prefix: "Every voice",
  heading_line2_highlight: "counts",
  testimonials: fallbackTestimonials,
};

function safeTestimonials(raw: unknown): ImpactTestimonial[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t) => t && typeof t === "object")
    .map((t) => t as ImpactTestimonial)
    .filter(
      (t) =>
        typeof t.quote === "string" &&
        typeof t.name === "string" &&
        typeof t.role === "string" &&
        typeof t.avatar === "string"
    );
}

export default function Impact({ content }: { content: ImpactContent | null }) {
  const c = content || fallback;
  const testimonials = safeTestimonials(c.testimonials).length ? safeTestimonials(c.testimonials) : fallbackTestimonials;
  return (
    <section id="impact" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12 md:mb-16">
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
              <span className="text-gradient">{c.heading_line2_highlight || fallback.heading_line2_highlight}</span>.
            </h2>
          </Reveal>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {testimonials.map((t, i) => (
            <TiltCard
              key={i}
              className="card-shadow flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-card p-6 transition-all duration-500 sm:p-8 md:p-10 hover:border-border-hover"
            >
              <span className="text-gradient mb-3 font-[family-name:var(--font-heading)] text-4xl leading-none sm:mb-4 sm:text-5xl md:text-6xl">
                &ldquo;
              </span>
              <p className="flex-1 text-[0.95rem] italic leading-relaxed text-text-secondary">
                {t.quote}
              </p>
              <div className="mt-7 flex items-center gap-3 border-t border-border pt-5">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-border">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-text-tertiary">{t.role}</p>
                </div>
              </div>
            </TiltCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
