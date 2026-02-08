"use client";

import { motion } from "framer-motion";
import { Reveal, fadeUp, staggerContainer } from "@/lib/motion";

const team = [
  {
    name: "Marcus Jack",
    role: "Director",
    focus: "Communications & Programme Lead",
  },
  {
    name: "Laverne John",
    role: "Director",
    focus: "Creative Lead",
  },
];

export default function Team() {
  return (
    <section id="team" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:gap-20">
          {/* Left - Content */}
          <div>
            <Reveal>
              <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                Our Team
              </span>
            </Reveal>
            <Reveal>
              <h2 className="mb-6 font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                Led by the{" "}
                <span className="text-gradient">community</span>
              </h2>
            </Reveal>
            <div className="space-y-5">
              <Reveal>
                <p className="text-base leading-relaxed text-text-secondary md:text-lg">
                  Hold It Down CIC was incorporated in 2022 and is led by two
                  directors with deep roots in the communities we serve. Our
                  leadership team brings together lived experience, creative
                  expertise, and a shared commitment to empowering young people
                  and families.
                </p>
              </Reveal>
              <Reveal>
                <p className="leading-relaxed text-text-secondary">
                  As a Community Interest Company, we are committed to
                  transparency, accountability, and community benefit. All our
                  activities are designed to serve the public interest, with a
                  particular focus on young people from Black and minoritised
                  backgrounds in South London.
                </p>
              </Reveal>
            </div>
          </div>

          {/* Right - Team Cards */}
          <motion.div
            className="flex flex-col gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {team.map((member) => (
              <motion.div
                key={member.name}
                variants={fadeUp}
                className="rounded-2xl border border-border bg-bg-card p-6 sm:p-8"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-glow font-[family-name:var(--font-heading)] text-lg font-bold text-accent">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-accent">
                  {member.role}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {member.focus}
                </p>
              </motion.div>
            ))}

            {/* Governance Statement */}
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-accent/10 bg-gradient-to-br from-bg-card to-accent/[0.03] p-6 sm:p-8"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
                Governance
              </p>
              <p className="text-sm leading-relaxed text-text-secondary">
                Hold It Down CIC (Company No. 14377702) is a Community Interest
                Company registered in England &amp; Wales. We are committed to
                transparency, community benefit, and reinvesting in the people
                and places we serve.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
