"use client";

import { motion } from "framer-motion";
import { Reveal, fadeUp, staggerContainer, TiltCard } from "@/lib/motion";
import type { SupportContent } from "@/lib/types";

const defaultWays = [
    { icon: "heart", title: "Donate", desc: "Support workshops, materials and safe spaces for young people and families." },
    { icon: "people", title: "Partner With Us", desc: "Collaborate with Hold It Down to strengthen impact across South London communities." },
    { icon: "flag", title: "Volunteer", desc: "Share your time, skills or lived experience to support our programmes." },
    { icon: "briefcase", title: "In-kind Support", desc: "Contribute space, equipment or professional expertise to empower our work." },
];

function SupportIcon({ name }: { name: string }) {
    switch (name) {
        case "heart":
            return (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            );
        case "people":
            return (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            );
        case "flag":
            return (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
            );
        case "briefcase":
            return (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
            );
        default:
            return (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            );
    }
}

interface SupportProps {
    content: SupportContent | null;
}

export default function Support({ content }: SupportProps) {
    const sectionLabel = content?.section_label ?? "Support Us";
    const heading = content?.heading ?? "Support Hold It Down";
    const description = content?.description ?? "Your support helps us deliver free and accessible creative, wellbeing and intergenerational programmes across South London.";
    const ways = content?.ways ?? defaultWays;
    const ctaText = content?.cta_text ?? "Get in touch to support our work";

    // Split heading for gradient
    const headingParts = heading.split(" ");
    const lastWords = headingParts.slice(-3).join(" ");
    const headingPrefix = headingParts.slice(0, -3).join(" ");

    return (
        <section id="support" className="py-10 sm:py-16 md:py-20">
            <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
                {/* Header */}
                <div className="mb-10 text-center sm:mb-14 md:mb-16">
                    <Reveal>
                        <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                            {sectionLabel}
                        </span>
                    </Reveal>
                    <Reveal>
                        <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                            {headingPrefix}{" "}
                            <span className="text-gradient">{lastWords}</span>
                        </h2>
                    </Reveal>
                    <Reveal>
                        <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg">
                            {description}
                        </p>
                    </Reveal>
                </div>

                {/* Support Cards */}
                <motion.div
                    className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                >
                    {ways.map((way) => (
                        <TiltCard
                            key={way.title}
                            className="card-shadow group relative overflow-hidden rounded-2xl border border-border bg-bg-card p-6 transition-all duration-500 sm:p-8 hover:border-border-hover hover:bg-bg-card-hover"
                        >
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent-warm opacity-0 transition-opacity duration-400 group-hover:opacity-100" />
                            <div className="mb-5 text-accent"><SupportIcon name={way.icon} /></div>
                            <h3 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold">
                                {way.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-text-secondary">
                                {way.desc}
                            </p>
                        </TiltCard>
                    ))}
                </motion.div>

                {/* CTA */}
                <Reveal>
                    <div className="mt-10 text-center sm:mt-14">
                        <a
                            href="/contact"
                            className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-accent to-accent-warm px-8 py-3.5 text-sm font-semibold text-white transition-all sm:w-auto sm:px-10 sm:py-4 sm:text-base hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <span>{ctaText}</span>
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
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
