"use client";

import Image from "next/image";
import { Reveal } from "@/lib/motion";
import type { AboutContent } from "@/lib/types";

const defaultFocusAreas = [
  { icon: "🧠", text: "Emotional literacy & wellbeing" },
  { icon: "💪", text: "Positive masculinity & male role modelling" },
  { icon: "🤝", text: "Intergenerational connection & cohesion" },
  { icon: "🏠", text: "Safe, inclusive spaces for healing" },
];

interface AboutProps {
  content: AboutContent | null;
}

export default function About({ content }: AboutProps) {
  const calloutTitle = content?.callout_title ?? "Intergenerational at our core";
  const calloutText = content?.callout_text ?? "Intergenerational work is central to our approach, bringing young people and older adults together to learn, create and strengthen community connections.";
  const aboutImage = content?.image ?? "/media/image-2.jpeg";
  const aboutImageAlt = content?.image_alt ?? "Hold It Down CIC banner - I Can Because You Can";
  const badgeYear = content?.badge_year ?? "Est. 2022";
  const badgeLocation = content?.badge_location ?? "Croydon, South London";
  const sectionLabel = content?.section_label ?? "Who We Are";
  const heading = content?.heading ?? "Culturally rooted, community driven";
  const paragraphs = content?.paragraphs ?? [
    "Hold It Down Community Interest Company (CIC) is a Croydon-based organisation that creates culturally rooted, intergenerational spaces to build emotional wellbeing, confidence and connection across families and communities.",
    "Our work combines sport, creative expression, dialogue and mentorship to strengthen relationships, promote positive identity and support long-term resilience. We work with children, young people, parents, fathers, carers and elders.",
    "Our work is rooted in trust, co-production, and accessibility. We activate familiar community spaces to make engagement feel safe, inclusive, and relevant \u2014 designing projects with and for the people we serve, particularly young people from Black and minoritised backgrounds.",
  ];
  const focusAreas = content?.focus_areas ?? defaultFocusAreas;

  // Split heading into parts for gradient styling
  const headingParts = heading.split(",");
  const headingMain = headingParts[0] + ",";
  const headingHighlight = headingParts.slice(1).join(",").trim();

  return (
    <section id="about" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">

        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-20">
          {/* Left - Image */}
          <Reveal>
            <div className="relative overflow-visible pr-4 pb-4 sm:pr-5 sm:pb-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
                <Image
                  src={aboutImage}
                  alt={aboutImageAlt}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-transparent" />
              </div>
              {/* Floating badge */}
              <div className="absolute right-0 bottom-0 rounded-xl border border-border bg-bg-card px-4 py-3 shadow-lg sm:px-5 sm:py-4">
                <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-accent sm:text-xl">
                  {badgeYear}
                </p>
                <p className="text-[0.65rem] text-text-secondary sm:text-xs">
                  {badgeLocation}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Right - Content */}
          <div>
            <Reveal>
              <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                {sectionLabel}
              </span>
            </Reveal>
            <Reveal>
              <h2 className="mb-6 font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                {headingMain}{" "}
                <span className="text-gradient">{headingHighlight}</span>
              </h2>
            </Reveal>
            <div className="space-y-5">
              {paragraphs.map((p, i) => (
                <Reveal key={i}>
                  <p className={`leading-relaxed text-text-secondary ${i === 0 ? "text-base md:text-lg" : ""}`}>
                    {p}
                  </p>
                </Reveal>
              ))}
              {/* Focus Areas */}
              <Reveal>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {focusAreas.map((area) => (
                    <div
                      key={area.text}
                      className="flex items-start gap-3 rounded-lg border border-border bg-bg-card px-4 py-3"
                    >
                      <span className="text-lg leading-none">{area.icon}</span>
                      <span className="text-sm leading-snug text-text-secondary">
                        {area.text}
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
