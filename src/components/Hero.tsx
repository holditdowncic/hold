"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Reveal, fadeUp } from "@/lib/motion";

export default function Hero() {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    const count = window.innerWidth < 768 ? 10 : 20;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      const size = 2 + Math.random() * 3;
      p.style.cssText = `
        left:${Math.random() * 100}%;
        top:${40 + Math.random() * 60}%;
        animation-delay:${Math.random() * 8}s;
        animation-duration:${5 + Math.random() * 5}s;
        width:${size}px;
        height:${size}px;
      `;
      container.appendChild(p);
    }
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-5 pt-24 pb-12 sm:min-h-screen sm:px-6 sm:pb-16 md:pt-32 md:pb-20"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, var(--hero-glow-1) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, var(--hero-glow-2) 0%, transparent 50%)",
          }}
        />
        <div ref={particlesRef} className="absolute inset-0" />
        <div className="hero-grid-bg absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1100px]">
        <div className="grid items-center gap-8 sm:grid-cols-[1fr_auto] sm:gap-10 md:gap-16">
          {/* Text Column */}
          <div className="text-center sm:text-left">
            <Reveal>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-3.5 py-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-text-secondary sm:mb-10 sm:gap-2.5 sm:px-5 sm:py-2 sm:text-xs">
                <span className="badge-dot h-1.5 w-1.5 rounded-full bg-accent sm:h-2 sm:w-2" />
                Community Interest Company &mdash; Croydon, UK
              </div>
            </Reveal>

            <div className="mb-8">
              <motion.h1
                className="font-[family-name:var(--font-heading)] text-[clamp(2.25rem,8vw,5.5rem)] font-bold leading-[1.05] tracking-tight"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.15 } },
                }}
              >
                <motion.span
                  className="block overflow-hidden"
                  variants={fadeUp}
                >
                  I Can
                </motion.span>
                <motion.span
                  className="block overflow-hidden"
                  variants={fadeUp}
                >
                  <span className="text-gradient">You Can</span>
                </motion.span>
                <motion.span
                  className="block overflow-hidden"
                  variants={fadeUp}
                >
                  We Can
                </motion.span>
              </motion.h1>
            </div>

            <Reveal delay={0.3}>
              <p className="mx-auto mb-8 max-w-[540px] text-[clamp(0.9rem,2.5vw,1.15rem)] leading-relaxed text-text-secondary sm:mx-0 sm:mb-12">
                And together we can. A Croydon-based community interest company
                creating culturally rooted spaces that build emotional wellbeing,
                confidence and connection across families and communities.
              </p>
            </Reveal>

            <Reveal delay={0.5}>
              <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:justify-start sm:gap-4">
                <a
                  href="#programs"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector("#programs")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-accent to-accent-warm px-6 py-3.5 text-sm font-semibold text-white transition-all sm:w-auto sm:px-8 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span>Our Programs</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </a>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border-hover px-6 py-3.5 text-sm font-semibold text-text-primary transition-all sm:w-auto sm:px-8 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent/5"
                >
                  Get In Touch
                </a>
              </div>
            </Reveal>
          </div>

          {/* Hero Image - landscape on mobile, portrait on sm+ */}
          <Reveal delay={0.4}>
            {/* Mobile: landscape below text */}
            <div className="relative mx-auto w-full max-w-[400px] sm:hidden">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border">
                <Image
                  src="/media/image-10.jpeg"
                  alt="Hold It Down CIC volunteers at Roots & Wings Family Fun Day"
                  fill
                  className="object-cover object-top"
                  sizes="100vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/50 via-transparent to-transparent" />
              </div>
            </div>
            {/* Tablet/Desktop: portrait beside text */}
            <div className="relative mx-auto hidden w-[240px] sm:block md:w-[320px] lg:w-[380px]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border">
                <Image
                  src="/media/image-10.jpeg"
                  alt="Hold It Down CIC volunteers at Roots & Wings Family Fun Day"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 240px, 380px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
              </div>
              {/* Decorative accent */}
              <div className="absolute -right-3 -bottom-3 -z-10 h-full w-full rounded-2xl border border-accent/20 bg-accent/5" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block">
        <div className="flex h-10 w-6 items-start justify-center rounded-xl border-[1.5px] border-text-tertiary pt-2">
          <div
            className="h-2 w-0.5 rounded-full bg-accent"
            style={{ animation: "scrollBounce 2s infinite" }}
          />
        </div>
      </div>
    </section>
  );
}
