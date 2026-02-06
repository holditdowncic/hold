"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Reveal, fadeUp } from "@/lib/motion";

export default function Hero() {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    for (let i = 0; i < 30; i++) {
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
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-32 pb-20"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(232,168,56,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(212,118,58,0.06) 0%, transparent 50%)",
          }}
        />
        <div ref={particlesRef} className="absolute inset-0" />
        <div className="hero-grid-bg absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[900px] text-center">
        <Reveal>
          <div className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-border bg-bg-card px-5 py-2 text-xs font-medium uppercase tracking-wider text-text-secondary">
            <span className="badge-dot h-2 w-2 rounded-full bg-accent" />
            Community Interest Company &mdash; Croydon, UK
          </div>
        </Reveal>

        <div className="mb-8">
          <motion.h1
            className="font-[family-name:var(--font-heading)] text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[1.05] tracking-tight"
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
              Amplifying
            </motion.span>
            <motion.span
              className="block overflow-hidden"
              variants={fadeUp}
            >
              <span className="text-gradient">Unheard</span> Voices
            </motion.span>
          </motion.h1>
        </div>

        <Reveal delay={0.3}>
          <p className="mx-auto mb-12 max-w-[640px] text-[clamp(1rem,2vw,1.2rem)] leading-relaxed text-text-secondary">
            A bold movement rooted in lived experience and driven by the urgency
            for change. We centre truth, nurture belonging, and cultivate a
            culture where connection, care, and courage are lived actions.
          </p>
        </Reveal>

        <Reveal delay={0.5}>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#programs"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#programs")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-accent to-accent-warm px-8 py-3.5 text-sm font-semibold text-bg transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(232,168,56,0.25)]"
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
              className="inline-flex items-center gap-2 rounded-full border border-border-hover px-8 py-3.5 text-sm font-semibold text-text-primary transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/5"
            >
              Get In Touch
            </a>
          </div>
        </Reveal>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
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
