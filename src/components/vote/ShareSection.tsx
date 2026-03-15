"use client";

import { Reveal, fadeIn } from "@/lib/motion";

export default function ShareSection() {
    return (
        <>
            {/* Share the Recognition */}
            <section className="px-5 py-16 sm:px-6">
                <div className="mx-auto max-w-[900px] text-center">
                    <Reveal>
                        <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.75rem,5vw,2.75rem)] font-bold text-text-primary mb-6 tracking-tight">
                            Share the <span className="text-gradient">Recognition</span>
                        </h2>
                    </Reveal>
                    <Reveal delay={0.1} variants={fadeIn}>
                        <p className="text-sm text-text-secondary mb-8 max-w-[550px] mx-auto leading-relaxed">
                            Know someone who deserves recognition? Share this page and invite
                            others to vote so we can celebrate the men whose influence
                            strengthens our communities.
                        </p>
                    </Reveal>
                    <Reveal delay={0.2}>
                        <button
                            onClick={async () => {
                                try {
                                    if (navigator.share) {
                                        await navigator.share({
                                            title: "Roots & Wings Community Awards 2026",
                                            text: "Vote for the men who make a difference in our community!",
                                            url: "https://www.holditdown.uk/vote",
                                        });
                                    } else {
                                        await navigator.clipboard.writeText(
                                            "https://www.holditdown.uk/vote"
                                        );
                                    }
                                } catch {
                                    // User cancelled the share dialog — no action needed
                                }
                            }}
                            className="group inline-flex items-center gap-2.5 rounded-full border border-border-hover px-8 py-3.5 text-sm font-semibold text-text-primary transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent/5 hover:shadow-md"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                            Share This Page
                        </button>
                    </Reveal>
                </div>
            </section>

            {/* Nominate for Next Year */}
            <section className="px-5 py-16 sm:px-6">
                <div className="mx-auto max-w-[900px]">
                    <Reveal>
                        <div className="rounded-2xl border border-border bg-bg-card p-8 md:p-10 text-center">
                            <h2 className="font-[family-name:var(--font-heading)] text-xl md:text-2xl font-bold text-text-primary mb-4 tracking-tight">
                                Nominate for Next Year
                            </h2>
                            <p className="text-sm text-text-secondary mb-6 max-w-[500px] mx-auto leading-relaxed">
                                If you know a father, mentor or male role model who deserves
                                recognition in future Roots & Wings awards, we welcome
                                nominations.
                            </p>
                            <a
                                href="mailto:info@holditdown.uk"
                                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-warm px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/20"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                info@holditdown.uk
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
