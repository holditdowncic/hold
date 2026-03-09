"use client";

import { Reveal, fadeIn } from "@/lib/motion";

export default function ThemeBanner() {
    return (
        <section className="px-5 py-12 sm:px-6">
            <div className="mx-auto max-w-[900px]">
                <Reveal variants={fadeIn}>
                    <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/5 via-accent/10 to-accent-warm/5 px-8 py-10 text-center">
                        {/* Decorative orbs */}
                        <div className="cta-orb-1 absolute -top-20 -left-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
                        <div className="cta-orb-2 absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-accent-warm/10 blur-3xl" />

                        <h3 className="relative font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-text-primary mb-2 tracking-tight">
                            Roots & Wings 2026
                        </h3>
                        <p className="relative text-lg md:text-xl font-semibold text-gradient">
                            Three Generations. One Influence.
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
