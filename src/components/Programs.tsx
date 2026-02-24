"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Reveal, fadeUp, staggerContainer, TiltCard } from "@/lib/motion";
import type { Program, Initiative, ProgramsSectionContent } from "@/lib/types";

const defaultPrograms: Program[] = [
  { id: "1", title: "Echoes of Us", description: "A powerful journey for fathers, sons, and mentors. Explores masculinity, emotions, and the bonds that unite generations through workshops, open conversations, and creative activities.", tags: ["Fathers & Sons", "Mentorship", "Masculinity"], image_url: "/media/roots/roots-13.jpeg", image_alt: "Fathers and mentors at outdoor discussion session", is_flagship: false, sort_order: 1 },
  { id: "2", title: "Voices Together", description: "Using storytelling, creativity, and performance to give young people a platform to be heard. Develops leadership, communication, and digital media skills while celebrating identity.", tags: ["Storytelling", "Leadership", "Digital Media"], image_url: "/media/roots/roots-15.jpeg", image_alt: "Community members gathering for storytelling and performances", is_flagship: false, sort_order: 2 },
  { id: "3", title: "Talk Di TingZ", description: "Our youth-led podcast offering a safe space for young people to discuss real issues \u2014 identity, relationships, and emotional wellbeing. Building a culture of openness where young people lead the conversation.", tags: ["Youth Podcast", "Safe Space", "Identity"], image_url: "/media/talkdi/talkdi-1.jpeg", image_alt: "Talk Di TingZ youth podcast team", is_flagship: false, sort_order: 3 },
  { id: "4", title: "Our Voices, Our Stage", description: "A platform for advocacy, performance, and youth leadership. From spoken word to performance showcases, equipping young people with the tools to inspire audiences and influence change.", tags: ["Spoken Word", "Performance", "Advocacy"], image_url: "/media/roots/roots-17.jpeg", image_alt: "Young people performing and celebrating at community event", is_flagship: false, sort_order: 4 },
];

const defaultInitiatives: Initiative[] = [
  { id: "1", title: "Mentoring", detail: "One-to-one and group support (10\u201317 years)", sort_order: 1 },
  { id: "2", title: "Entrepreneurship", detail: "Work experience & career pathways (14\u201317 years)", sort_order: 2 },
  { id: "3", title: "Workshops & Retreats", detail: "Life skills, wellbeing & personal growth", sort_order: 3 },
  { id: "4", title: "Sports & Football", detail: "Teamwork, discipline & confidence", sort_order: 4 },
  { id: "5", title: "Family Support", detail: "Loving Yourself & The Gents Network", sort_order: 5 },
];

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary">
      {children}
    </span>
  );
}

interface ProgramsProps {
  programs: Program[];
  initiatives: Initiative[];
  meta: ProgramsSectionContent | null;
}

export default function Programs({ programs, initiatives, meta }: ProgramsProps) {
  const programsData = programs.length > 0 ? programs : defaultPrograms;
  const initiativesData = initiatives.length > 0 ? initiatives : defaultInitiatives;

  const sectionLabel = meta?.section_label ?? "Our Programmes";
  const headingPrefix = meta?.heading_prefix ?? "Designed to";
  const headingHighlight1 = meta?.heading_highlight1 ?? "inspire, connect";
  const headingMid = meta?.heading_mid ?? "and";
  const headingHighlight2 = meta?.heading_highlight2 ?? "empower";
  const description = meta?.description ?? "Each project responds directly to the needs of our community, giving young people and families the tools to grow in confidence, creativity, and resilience.";
  const flagshipLabel = meta?.flagship_label ?? "Flagship Programme";
  const flagshipTitle = meta?.flagship_title ?? "Roots & Wings";
  const flagshipDesc = meta?.flagship_desc ?? "A celebration of fatherhood, family, and intergenerational connection. Roots & Wings brings fathers, children, and families together through sports, workshops, and shared experiences that strengthen bonds and create lasting memories.";
  const flagshipDesc2 = meta?.flagship_desc2 ?? "It\u2019s about planting roots of love and giving wings of confidence to future generations. The programme now forms the foundation for longer-term intergenerational and male mentorship work across Croydon.";
  const flagshipImage = meta?.flagship_image ?? "/media/roots/roots-23.jpeg";
  const flagshipImageAlt = meta?.flagship_image_alt ?? "Families and children at the Roots & Wings Family Fun Day";
  const flagshipTags = meta?.flagship_tags ?? ["Fatherhood", "Intergenerational", "Family Unity", "Wellbeing"];

  return (
    <section id="programs" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* Header */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-20">
          <div>
            <Reveal>
              <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                {sectionLabel}
              </span>
            </Reveal>
            <Reveal>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                {headingPrefix}{" "}
                <span className="text-gradient">{headingHighlight1}</span> {headingMid}{" "}
                <span className="text-gradient">{headingHighlight2}</span>
              </h2>
            </Reveal>
          </div>
          <div className="flex items-end">
            <Reveal>
              <p className="text-base leading-relaxed text-text-secondary md:text-lg">
                {description}
              </p>
            </Reveal>
          </div>
        </div>

        {/* Programs Grid */}
        <motion.div
          className="mt-10 grid gap-5 sm:mt-14 sm:gap-6 md:mt-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {/* Featured: Roots & Wings */}
          <TiltCard className="group relative col-span-full overflow-hidden rounded-2xl border border-accent/10 bg-gradient-to-br from-bg-card to-accent/[0.03]">
            <div className="grid items-center md:grid-cols-2">
              <div className="relative aspect-[16/10] sm:aspect-[2/1] md:aspect-auto md:h-full md:min-h-[350px]">
                <Image
                  src={flagshipImage}
                  alt={flagshipImageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-card/80 hidden md:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 to-transparent md:hidden" />
              </div>
              <div className="relative p-6 sm:p-8 md:p-10 lg:p-12">
                <span className="mb-4 inline-block rounded-full border border-accent/15 bg-accent-glow px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
                  {flagshipLabel}
                </span>
                <h3 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-semibold sm:text-3xl">
                  {flagshipTitle}
                </h3>
                <p className="mb-4 leading-relaxed text-text-secondary">
                  {flagshipDesc}
                </p>
                <p className="mb-6 text-sm leading-relaxed text-text-secondary">
                  {flagshipDesc2}
                </p>
                <div className="flex flex-wrap gap-2">
                  {flagshipTags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>

          {/* Other Programmes */}
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
            {programsData.map((prog) => (
              <TiltCard
                key={prog.id}
                className="card-shadow group overflow-hidden rounded-2xl border border-border bg-bg-card transition-all duration-500 hover:border-border-hover"
              >
                {prog.image_url && (
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={prog.image_url}
                      alt={prog.image_alt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
                  </div>
                )}
                <div className="p-5 sm:p-6">
                  <h3 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold">
                    {prog.title}
                  </h3>
                  <p className="mb-5 text-[0.95rem] leading-relaxed text-text-secondary">
                    {prog.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {prog.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>

          {/* Other Initiatives */}
          <Reveal>
            <div className="rounded-2xl border border-border bg-bg-card p-6 sm:p-8">
              <h3 className="mb-5 font-[family-name:var(--font-heading)] text-xl font-semibold">
                Other Initiatives
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {initiativesData.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-bg-elevated px-4 py-3"
                  >
                    <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {item.title}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </motion.div>
      </div>
    </section>
  );
}
