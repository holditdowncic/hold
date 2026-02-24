"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Reveal, fadeUp, staggerContainer, TiltCard } from "@/lib/motion";
import type { TeamMember } from "@/lib/types";

const defaultTeam: TeamMember[] = [
    { id: "1", name: "Marcus Jack", role: "Director, Communications & Programme Lead", image_url: null, sort_order: 1 },
    { id: "2", name: "Laverne John", role: "Director, Creative Lead", image_url: null, sort_order: 2 },
];

interface TeamProps {
    members: TeamMember[];
}

function MemberIcon() {
    return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

export default function Team({ members }: TeamProps) {
    const teamData = members.length > 0 ? members : defaultTeam;

    return (
        <section id="team" className="py-12 sm:py-16 md:py-20">
            <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
                {/* Header */}
                <div className="mb-10 text-center sm:mb-14 md:mb-16">
                    <Reveal>
                        <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                            Team &amp; Governance
                        </span>
                    </Reveal>
                    <Reveal>
                        <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                            Meet the{" "}
                            <span className="text-gradient">team</span>
                        </h2>
                    </Reveal>
                    <Reveal>
                        <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg">
                            Hold It Down CIC was incorporated in 2022 and is legally committed
                            to benefiting the community.
                        </p>
                    </Reveal>
                </div>

                {/* Team Cards */}
                <motion.div
                    className="mx-auto grid max-w-[700px] gap-6 sm:grid-cols-2"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                >
                    {teamData.map((member) => (
                        <TiltCard
                            key={member.id}
                            className="card-shadow group flex flex-col items-center overflow-hidden rounded-2xl border border-border bg-bg-card p-8 text-center transition-all duration-500 sm:p-10 hover:border-border-hover hover:bg-bg-card-hover"
                        >
                            {/* Avatar */}
                            <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-accent-glow text-accent">
                                {member.image_url ? (
                                    <Image
                                        src={member.image_url}
                                        alt={member.name}
                                        width={80}
                                        height={80}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <MemberIcon />
                                )}
                            </div>
                            <h3 className="mb-2 font-[family-name:var(--font-heading)] text-xl font-semibold">
                                {member.name}
                            </h3>
                            <p className="text-sm leading-relaxed text-text-secondary">
                                {member.role}
                            </p>
                        </TiltCard>
                    ))}
                </motion.div>

                {/* Governance Statement */}
                <Reveal>
                    <div className="mx-auto mt-10 max-w-[800px] rounded-2xl border border-border bg-bg-card p-6 sm:mt-14 sm:p-8">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-glow text-accent">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="mb-2 font-[family-name:var(--font-heading)] text-lg font-semibold">
                                    Governance
                                </h4>
                                <p className="text-sm leading-relaxed text-text-secondary">
                                    Hold It Down CIC is a legally incorporated Community Interest
                                    Company, governed by directors committed to transparency,
                                    accountability, and meaningful community impact. All decisions
                                    prioritise the wellbeing of the communities we serve.
                                </p>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
