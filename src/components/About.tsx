"use client";

import Image from "next/image";
import { Reveal } from "@/lib/motion";

export default function About() {
  return (
    <section id="about" className="py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-20">
          {/* Left - Image */}
          <Reveal>
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
                <Image
                  src="https://images.unsplash.com/photo-1529070538774-1f9e5c292307?w=800&h=600&fit=crop"
                  alt="Young people in an urban community workshop setting"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-transparent" />
              </div>
              {/* Floating badge */}
              <div className="absolute -right-3 -bottom-3 rounded-xl border border-border bg-bg-card px-4 py-3 shadow-lg sm:-right-4 sm:-bottom-4 sm:px-5 sm:py-4">
                <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-accent sm:text-xl">
                  Est. 2022
                </p>
                <p className="text-[0.65rem] text-text-secondary sm:text-xs">
                  Thornton Heath, Croydon
                </p>
              </div>
            </div>
          </Reveal>

          {/* Right - Content */}
          <div>
            <Reveal>
              <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                Who We Are
              </span>
            </Reveal>
            <Reveal>
              <h2 className="mb-6 font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                Built on <span className="text-gradient">lived experience</span>,
                driven by <span className="text-gradient">purpose</span>
              </h2>
            </Reveal>
            <div className="space-y-5">
              <Reveal>
                <p className="text-base leading-relaxed text-text-secondary md:text-lg">
                  Hold It Down CIC is a Community Interest Company based in Thornton
                  Heath, Croydon. We create inclusive spaces for young people and
                  families from underrepresented backgrounds to express themselves,
                  heal, and lead.
                </p>
              </Reveal>
              <Reveal>
                <p className="leading-relaxed text-text-secondary">
                  We invest in what matters most:{" "}
                  <strong className="text-text-primary">people</strong>. Nurturing
                  local talent and strengthening grassroots networks, we lay the
                  groundwork for transformation that is meaningful, resilient, and
                  enduring. Our approach is grounded, realistic, and responsive to
                  community needs.
                </p>
              </Reveal>
              <Reveal>
                <p className="leading-relaxed text-text-secondary">
                  Every story matters. We build platforms that centre real
                  experiences and lived truth, prioritising intergenerational
                  connection and youth voice. Through creativity, emotional honesty,
                  and community-led approaches, we ensure people feel seen, valued,
                  and confident in shaping their futures.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
