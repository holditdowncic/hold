"use client";

import { Reveal, fadeIn } from "@/lib/motion";

export default function CredibilityBanner() {
    return (
        <section className="px-5 py-6 sm:px-6">
            <div className="mx-auto max-w-[900px]">
                <Reveal variants={fadeIn}>
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-card px-6 py-5 text-center">
                        <div
                            className="absolute inset-0 opacity-50"
                            style={{
                                background:
                                    "radial-gradient(ellipse at 50% 50%, var(--t-accent-glow) 0%, transparent 70%)",
                            }}
                        />
                        <p className="relative text-base md:text-lg font-semibold text-text-primary">
                            Last year more than{" "}
                            <span className="text-gradient">250 people</span> attended Roots &
                            Wings to celebrate fathers, families and community leadership.
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
