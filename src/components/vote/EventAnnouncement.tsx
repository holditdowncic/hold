"use client";

import { Reveal } from "@/lib/motion";

export default function EventAnnouncement() {
    return (
        <section className="px-5 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-[900px]">
                <Reveal>
                    <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.75rem,5vw,2.75rem)] font-bold text-text-primary mb-10 text-center tracking-tight">
                        Where Winners Will Be{" "}
                        <span className="text-gradient">Announced</span>
                    </h2>
                </Reveal>

                <Reveal delay={0.1}>
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-card">
                        {/* Decorative gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent-warm/5" />

                        <div className="relative p-8 md:p-10 text-center">
                            <p className="text-base text-text-secondary mb-8 leading-relaxed">
                                Winners will be announced during the Roots & Wings Family Fun
                                Day.
                            </p>

                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-5 py-2 text-sm font-semibold text-accent mb-4">
                                    📅 Saturday 20 June 2026
                                </div>
                                <div className="text-sm leading-relaxed text-text-secondary space-y-0.5">
                                    <p className="font-medium text-text-primary">
                                        Heavers Farm Primary School
                                    </p>
                                    <p>58 Dinsdale Gardens</p>
                                    <p>South Norwood, London SE25 6LT</p>
                                </div>
                            </div>

                            <p className="text-sm text-text-tertiary max-w-[500px] mx-auto">
                                Roots & Wings brings together families, fathers and community
                                members for a day of football, games, performances, food and
                                celebration.
                            </p>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
