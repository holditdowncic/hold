"use client";

import { Reveal } from "@/lib/motion";

export default function ClosingStatement() {
    return (
        <section className="px-5 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-[900px] text-center">
                <Reveal>
                    <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-bg-card to-accent-warm/5 p-10 md:p-14">
                        {/* Decorative orbs */}
                        <div className="cta-orb-1 absolute -top-24 -left-24 h-48 w-48 rounded-full bg-accent/8 blur-3xl" />
                        <div className="cta-orb-2 absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-accent-warm/8 blur-3xl" />

                        <p className="relative font-[family-name:var(--font-heading)] text-lg md:text-xl font-bold text-text-primary leading-relaxed mb-4 tracking-tight">
                            Every vote is a chance to recognise a man who is making a
                            difference.
                        </p>
                        <p className="relative text-sm md:text-base text-text-secondary leading-relaxed max-w-[600px] mx-auto">
                            Help us celebrate the fathers, mentors and role models shaping our
                            communities. Together we honour the influence that often goes
                            unseen but never goes unfelt.
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
