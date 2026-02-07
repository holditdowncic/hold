"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Reveal, fadeUp, staggerContainer, TiltCard } from "@/lib/motion";

const programmes = [
  {
    title: "Echoes of Us",
    desc: "A powerful journey for fathers, sons, and mentors. Explores masculinity, emotions, and the bonds that unite generations through workshops, open conversations, and creative activities.",
    tags: ["Fathers & Sons", "Mentorship", "Masculinity"],
    image:
      "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&h=400&fit=crop",
    imageAlt: "Fathers and sons connecting through mentorship activities",
  },
  {
    title: "Voices Together",
    desc: "Using storytelling, creativity, and performance to give young people a platform to be heard. Develops leadership, communication, and digital media skills while celebrating identity.",
    tags: ["Storytelling", "Leadership", "Digital Media"],
    image:
      "https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=600&h=400&fit=crop",
    imageAlt: "Young people expressing themselves through creative storytelling",
  },
  {
    title: "Talk Di TingZ",
    desc: "Our youth-led podcast offering a safe space for young people to discuss real issues — identity, relationships, and emotional wellbeing. Building a culture of openness where young people lead the conversation.",
    tags: ["Youth Podcast", "Safe Space", "Identity"],
    image:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=400&fit=crop",
    imageAlt: "Young people recording a podcast discussion",
  },
  {
    title: "Our Voices, Our Stage",
    desc: "A platform for advocacy, performance, and youth leadership. From spoken word to performance showcases, equipping young people with the tools to inspire audiences and influence change.",
    tags: ["Spoken Word", "Performance", "Advocacy"],
    image:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop",
    imageAlt: "Young people performing on stage with confidence",
  },
];

const otherInitiatives = [
  { title: "Mentoring", detail: "One-to-one and group support (10–17 years)" },
  { title: "Entrepreneurship", detail: "Work experience & career pathways (14–17 years)" },
  { title: "Workshops & Retreats", detail: "Life skills, wellbeing & personal growth" },
  { title: "Sports & Football", detail: "Teamwork, discipline & confidence" },
  { title: "Family Support", detail: "Loving Yourself & The Gents Network" },
];

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary">
      {children}
    </span>
  );
}

export default function Programs() {
  return (
    <section id="programs" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* Header */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-20">
          <div>
            <Reveal>
              <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                Our Programmes
              </span>
            </Reveal>
            <Reveal>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                Designed to{" "}
                <span className="text-gradient">inspire, connect</span> and{" "}
                <span className="text-gradient">empower</span>
              </h2>
            </Reveal>
          </div>
          <div className="flex items-end">
            <Reveal>
              <p className="text-base leading-relaxed text-text-secondary md:text-lg">
                Each project responds directly to the needs of our community,
                giving young people and families the tools to grow in confidence,
                creativity, and resilience.
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
              {/* Image */}
              <div className="relative aspect-[16/10] sm:aspect-[2/1] md:aspect-auto md:h-full md:min-h-[350px]">
                <Image
                  src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop"
                  alt="Families and young people at the Roots and Wings programme"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-card/80 hidden md:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 to-transparent md:hidden" />
              </div>
              {/* Content */}
              <div className="relative p-6 sm:p-8 md:p-10 lg:p-12">
                <span className="mb-4 inline-block rounded-full border border-accent/15 bg-accent-glow px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
                  Flagship Programme
                </span>
                <h3 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-semibold sm:text-3xl">
                  Roots & Wings
                </h3>
                <p className="mb-4 leading-relaxed text-text-secondary">
                  A celebration of fatherhood, family, and intergenerational
                  connection. Roots & Wings brings fathers, children, and
                  families together through sports, workshops, and shared
                  experiences that strengthen bonds and create lasting memories.
                </p>
                <p className="mb-6 text-sm leading-relaxed text-text-secondary">
                  It&apos;s about planting roots of love and giving wings of
                  confidence to future generations. The programme now forms the
                  foundation for longer-term intergenerational and male
                  mentorship work across Croydon.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Tag>Fatherhood</Tag>
                  <Tag>Intergenerational</Tag>
                  <Tag>Family Unity</Tag>
                  <Tag>Wellbeing</Tag>
                </div>
              </div>
            </div>
          </TiltCard>

          {/* Other Programmes - 2x2 grid */}
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
            {programmes.map((prog) => (
              <TiltCard
                key={prog.title}
                className="card-shadow group overflow-hidden rounded-2xl border border-border bg-bg-card transition-all duration-500 hover:border-border-hover"
              >
                {/* Card Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={prog.image}
                    alt={prog.imageAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
                </div>
                {/* Card Content */}
                <div className="p-5 sm:p-6">
                  <h3 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold">
                    {prog.title}
                  </h3>
                  <p className="mb-5 text-[0.95rem] leading-relaxed text-text-secondary">
                    {prog.desc}
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
                {otherInitiatives.map((item) => (
                  <div
                    key={item.title}
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
