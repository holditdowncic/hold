"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Reveal, fadeUp } from "@/lib/motion";
import type { HeroContent } from "@/lib/types";

interface HeroProps {
  content: HeroContent | null;
}

export default function Hero({ content }: HeroProps) {
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

  // Fallback to hardcoded content if Supabase is not configured
  const badge = content?.badge ?? "Community Interest Company \u2014 Croydon, UK";
  const line1 = content?.heading_line1 ?? "I Can Because";
  const line2 = content?.heading_line2 ?? "You Can.";
  const line3 = content?.heading_line3 ?? "And Together, We Can.";
  const subtitle = content?.subtitle ?? "Hold It Down CIC supports young people aged 12\u201325 and older adults through creative, wellbeing, and intergenerational programmes across South London.";
  const subtitle2 = content?.subtitle2 ?? "We create safe, culturally rooted spaces where people can express themselves, build confidence, and connect across generations.";
  const heroImage = content?.image ?? "/media/roots/roots-24.jpeg";
  const heroImageAlt = content?.image_alt ?? "Hold It Down CIC members gathered around a table in matching blue hoodies";
  const ctaPrimaryText = content?.cta_primary_text ?? "Explore Our Programmes";
  const ctaPrimaryLink = content?.cta_primary_link ?? "#programs";
  const ctaSecondaryText = content?.cta_secondary_text ?? "Support Our Work";
  const ctaSecondaryLink = content?.cta_secondary_link ?? "/contact";

  return (
    <section
      id="hero"
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 pt-20 pb-10 sm:min-h-screen sm:px-6 sm:pt-24 sm:pb-16 md:pt-32 md:pb-20"
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
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-3 py-1 text-[0.6rem] font-medium uppercase tracking-wider text-text-secondary sm:mb-10 sm:gap-2.5 sm:px-5 sm:py-2 sm:text-xs">
                <span className="badge-dot h-1.5 w-1.5 rounded-full bg-accent sm:h-2 sm:w-2" />
                {badge}
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
                  {line1}
                </motion.span>
                <motion.span
                  className="block overflow-hidden"
                  variants={fadeUp}
                >
                  <span className="text-gradient">{line2}</span>
                </motion.span>
                <motion.span
                  className="block overflow-hidden"
                  variants={fadeUp}
                >
                  {line3.includes("We Can") ? (
                    <>{line3.replace("We Can", "").replace(/\.$/, "")}<span className="text-gradient">We Can.</span></>
                  ) : (
                    line3
                  )}
                </motion.span>
              </motion.h1>
            </div>

            <Reveal delay={0.3}>
              <p className="mx-auto mb-4 max-w-[540px] text-[clamp(0.9rem,2.5vw,1.15rem)] leading-relaxed text-text-secondary sm:mx-0">
                {subtitle}
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <p className="mx-auto mb-8 max-w-[540px] text-[clamp(0.85rem,2.2vw,1.05rem)] leading-relaxed text-text-secondary sm:mx-0 sm:mb-12">
                {subtitle2}
              </p>
            </Reveal>

            <Reveal delay={0.5}>
              <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:justify-start sm:gap-4">
                <a
                  href={ctaPrimaryLink}
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector(ctaPrimaryLink)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-warm px-5 py-3 text-[0.8125rem] font-semibold text-white transition-all sm:w-auto sm:gap-2.5 sm:px-8 sm:py-3.5 sm:text-sm hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span>{ctaPrimaryText}</span>
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
                  href={ctaSecondaryLink}
                  onClick={(e) => {
                    if (ctaSecondaryLink.startsWith("#")) {
                      e.preventDefault();
                      document.querySelector(ctaSecondaryLink)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border-hover px-5 py-3 text-[0.8125rem] font-semibold text-text-primary transition-all sm:w-auto sm:px-8 sm:py-3.5 sm:text-sm hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent/5"
                >
                  {ctaSecondaryText}
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
                  src={heroImage}
                  alt={heroImageAlt}
                  fill
                  className="object-cover object-center"
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
                  src={heroImage}
                  alt={heroImageAlt}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 240px, 380px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
              </div>
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
