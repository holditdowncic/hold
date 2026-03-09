"use client";

import { useEffect, useRef } from "react";
import { Reveal, fadeUp } from "@/lib/motion";
import { motion } from "framer-motion";

export default function VoteHero() {
    const particlesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = particlesRef.current;
        if (!container) return;
        const count = window.innerWidth < 768 ? 8 : 16;
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
        <>
            {/* Full-width hero image with overlay */}
            <section className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
                <img
                    src="/media/roots/community-gathering.jpg"
                    alt="Roots & Wings Community Gathering - Men and families coming together"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--t-bg)]/60 via-transparent to-[var(--t-bg)]" />

                {/* Floating badge on image */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <Reveal>
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-border bg-bg-card/80 backdrop-blur-md px-5 py-2 text-xs font-medium uppercase tracking-wider text-text-secondary">
                            <span className="badge-dot h-2 w-2 rounded-full bg-accent" />
                            Roots & Wings Community Awards
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Hero text */}
            <section className="relative overflow-hidden px-5 pt-16 pb-10 sm:px-6 sm:pt-20">
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background:
                            "radial-gradient(ellipse at 30% 50%, var(--hero-glow-1) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, var(--hero-glow-2) 0%, transparent 50%)",
                    }}
                />
                <div ref={particlesRef} className="absolute inset-0 z-0" />
                <div className="hero-grid-bg absolute inset-0 z-0" />

                <div className="relative z-10 mx-auto max-w-[900px] text-center">
                    <motion.h1
                        className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,4.5rem)] font-bold leading-[1.05] tracking-tight mb-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.15 } },
                        }}
                    >
                        <motion.span className="block overflow-hidden" variants={fadeUp}>
                            The Roots & Wings
                        </motion.span>
                        <motion.span className="block overflow-hidden" variants={fadeUp}>
                            <span className="text-gradient">Community Awards</span> 2026
                        </motion.span>
                    </motion.h1>

                    <Reveal delay={0.3}>
                        <p className="mx-auto max-w-[660px] text-[clamp(1rem,2.5vw,1.2rem)] leading-relaxed text-text-secondary mb-4">
                            Celebrating the men who show up — recognising the men whose
                            influence strengthens families and communities across South London.
                        </p>
                    </Reveal>

                    <Reveal delay={0.4}>
                        <p className="mx-auto max-w-[660px] text-[clamp(0.9rem,2.2vw,1.05rem)] leading-relaxed text-text-secondary mb-6">
                            Across our communities there are men who quietly shape lives
                            through their presence, consistency and care. The Roots & Wings
                            Community Awards were created to celebrate the influence they carry.
                        </p>
                    </Reveal>

                    <Reveal delay={0.5}>
                        <a
                            href="#vote-form"
                            onClick={(e) => {
                                e.preventDefault();
                                document
                                    .querySelector("#vote-form")
                                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-accent to-accent-warm px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/20"
                        >
                            <span>Cast Your Vote</span>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="transition-transform group-hover:translate-y-0.5"
                            >
                                <path d="M12 5v14M19 12l-7 7-7-7" />
                            </svg>
                        </a>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
