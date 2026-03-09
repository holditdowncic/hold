"use client";

import { Reveal } from "@/lib/motion";

export default function WhyItMatters() {
    return (
        <section className="px-5 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-[900px]">
                <Reveal>
                    <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.75rem,5vw,2.75rem)] font-bold text-text-primary mb-10 text-center tracking-tight">
                        Why These Awards <span className="text-gradient">Matter</span>
                    </h2>
                </Reveal>

                <div className="grid gap-6 sm:grid-cols-3">
                    {[
                        {
                            icon: "🤝",
                            text: "Many men contribute to their communities without recognition.",
                        },
                        {
                            icon: "💡",
                            text: "These awards shine a light on the positive influence they bring.",
                        },
                        {
                            icon: "🗳️",
                            text: "Your vote helps ensure their impact is seen and valued.",
                        },
                    ].map((item, i) => (
                        <Reveal key={i} delay={i * 0.1}>
                            <div className="group rounded-2xl border border-border bg-bg-card p-6 text-center transition-all hover:border-accent/30 hover:bg-bg-card-hover hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5">
                                <div className="text-3xl mb-4">{item.icon}</div>
                                <p className="text-sm leading-relaxed text-text-secondary">
                                    {item.text}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
