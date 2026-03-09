"use client";

import { Reveal, fadeIn } from "@/lib/motion";

export default function CastYourVote() {
    return (
        <section id="vote-form" className="px-5 py-16 sm:px-6 sm:py-20 scroll-mt-24">
            <div className="mx-auto max-w-[900px] text-center">
                <Reveal>
                    <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.75rem,5vw,2.75rem)] font-bold text-text-primary mb-6 tracking-tight">
                        Cast Your <span className="text-gradient">Vote</span>
                    </h2>
                </Reveal>

                <Reveal delay={0.1} variants={fadeIn}>
                    <p className="text-[clamp(1rem,2.5vw,1.15rem)] text-text-secondary mb-4 max-w-[600px] mx-auto leading-relaxed">
                        Take 30 seconds to recognise a man making a difference.
                    </p>
                </Reveal>

                <Reveal delay={0.2} variants={fadeIn}>
                    <p className="text-sm text-text-tertiary mb-8 max-w-[600px] mx-auto">
                        Your vote helps celebrate the fathers, mentors and role models whose
                        influence strengthens our communities.
                    </p>
                </Reveal>

                <Reveal delay={0.3} variants={fadeIn}>
                    <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-5 py-2.5 text-sm font-medium text-accent">
                        <span className="badge-dot h-2 w-2 rounded-full bg-accent" />
                        Join hundreds of people recognising men in our community
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
