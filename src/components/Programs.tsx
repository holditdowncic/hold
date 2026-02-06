"use client";

import { motion } from "framer-motion";
import { Reveal, fadeUp, staggerContainer, TiltCard } from "@/lib/motion";

const programs = [
  {
    title: "Cultural Education",
    desc: "Culturally safe spaces where young people explore identity, heritage, and creative expression. We celebrate diversity and challenge inequality through education that centres lived experience.",
    tags: ["Identity", "Heritage", "Creative Expression"],
  },
  {
    title: "Youth Development",
    desc: "Skills-building workshops and mentoring that equip young people with confidence, resilience, and the tools to shape their futures. We nurture local talent and celebrate potential.",
    tags: ["Workshops", "Mentoring", "Skills"],
  },
  {
    title: "Community Support",
    desc: "Strengthening grassroots networks and providing support for families affected by inequality and exclusion. Real, grounded work that meets people where they are.",
    tags: ["Grassroots", "Families", "Inclusion"],
  },
];

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-text-secondary">
      {children}
    </span>
  );
}

export default function Programs() {
  return (
    <section id="programs" className="py-28 md:py-36">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div className="grid gap-10 md:grid-cols-2 md:gap-20">
          <div>
            <Reveal>
              <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                What We Do
              </span>
            </Reveal>
            <Reveal>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                Programmes shaped <span className="text-gradient">by</span> and{" "}
                <span className="text-gradient">for</span> the community
              </h2>
            </Reveal>
          </div>
          <div className="flex items-end">
            <Reveal>
              <p className="text-lg leading-relaxed text-text-secondary">
                Our initiatives are shaped through co-design with participants,
                responding to what local families and young people tell us they
                need.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Programs Grid */}
        <motion.div
          className="mt-20 grid gap-6 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {/* Featured: Roots & Wings */}
          <TiltCard className="group relative col-span-full overflow-hidden rounded-2xl border border-accent/10 bg-gradient-to-br from-bg-card to-accent/[0.03] p-10 md:p-12">
            <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
              <div>
                <span className="mb-4 inline-block rounded-full border border-accent/15 bg-accent-glow px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
                  National Lottery Funded
                </span>
                <h3 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-semibold">
                  Roots & Wings
                </h3>
                <p className="mb-6 leading-relaxed text-text-secondary">
                  A family-focused programme creating honest spaces for expression
                  and belonging. Co-designed with families and young people, Roots
                  & Wings nurtures intergenerational connection and amplifies youth
                  voice through creative workshops, dialogue sessions, and
                  community events.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Tag>Family Focused</Tag>
                  <Tag>Co-Designed</Tag>
                  <Tag>Youth Voice</Tag>
                </div>
              </div>
              {/* Decorative Circles */}
              <div className="relative hidden h-48 w-48 flex-shrink-0 md:block">
                <div className="orbit-circle absolute inset-0 rounded-full border-[1.5px] border-accent/20">
                  <div className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-accent shadow-[0_0_15px_var(--color-accent)]" />
                </div>
                <div className="orbit-circle-reverse absolute inset-7 rounded-full border-[1.5px] border-accent-warm/15">
                  <div className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-accent-warm shadow-[0_0_15px_var(--color-accent-warm)]" />
                </div>
              </div>
            </div>
          </TiltCard>

          {/* Other Programs */}
          {programs.map((prog) => (
            <TiltCard
              key={prog.title}
              className="group overflow-hidden rounded-2xl border border-border bg-bg-card p-10 transition-all duration-500 hover:border-border-hover"
            >
              <h3 className="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
                {prog.title}
              </h3>
              <p className="mb-6 text-[0.95rem] leading-relaxed text-text-secondary">
                {prog.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {prog.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </TiltCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
