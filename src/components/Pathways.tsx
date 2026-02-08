"use client";

import { motion } from "framer-motion";
import { Reveal, fadeUp, staggerContainer } from "@/lib/motion";

const audiences = [
  {
    title: "Young People",
    age: "Ages 12–25",
    desc: "Join creative workshops, community walks, mentoring sessions, and sports programmes designed to help you express yourself, build confidence, and connect with others who get it.",
    cta: "Join a Programme",
    href: "#programs",
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
    title: "Parents & Carers",
    age: "Families welcome",
    desc: "Attend family fun days, intergenerational workshops, and community events that strengthen bonds and create lasting memories. A space where families can be themselves.",
    cta: "Explore Events",
    href: "/events",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    title: "Older Adults",
    age: "Intergenerational",
    desc: "Share your experience and wisdom through mentoring, storytelling, and community activities. Our intergenerational programmes bridge the gap between generations.",
    cta: "Get Involved",
    href: "#contact",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "Partners & Funders",
    age: "Organisations",
    desc: "Collaborate with us to strengthen community impact. We welcome partnerships with councils, charities, businesses, and funders who share our values.",
    cta: "Partner With Us",
    href: "#contact",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    title: "Volunteers",
    age: "All backgrounds",
    desc: "Give your time, skills, or lived experience. Whether you can help at events, mentor young people, or support behind the scenes — every contribution matters.",
    cta: "Volunteer With Us",
    href: "#contact",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
];

export default function Pathways() {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  }

  return (
    <section id="pathways" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12 md:mb-16">
          <Reveal>
            <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Who We Serve
            </span>
          </Reveal>
          <Reveal>
            <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
              Find your{" "}
              <span className="text-gradient">pathway</span>
            </h2>
          </Reveal>
          <Reveal>
            <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg">
              Whether you&apos;re a young person, a parent, an older adult, or
              someone who wants to support grassroots change &mdash; there&apos;s
              a place for you here.
            </p>
          </Reveal>
        </div>

        {/* Audience Cards */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {audiences.map((a) => (
            <motion.div
              key={a.title}
              variants={fadeUp}
              className="flex flex-col rounded-2xl border border-border bg-bg-card p-6 transition-[border-color] duration-300 hover:border-accent/30 sm:p-8"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-glow text-accent">
                {a.icon}
              </div>
              <h3 className="mb-1 font-[family-name:var(--font-heading)] text-lg font-semibold">
                {a.title}
              </h3>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">
                {a.age}
              </p>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-text-secondary">
                {a.desc}
              </p>
              <a
                href={a.href}
                onClick={(e) => handleClick(e, a.href)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-warm"
              >
                {a.cta}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
