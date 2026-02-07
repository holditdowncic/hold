"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Reveal, fadeUp, staggerContainer } from "@/lib/motion";
import { events } from "@/lib/events-data";

// Show only the first 2 events as a preview
const previewEvents = events.slice(0, 2);

export default function Events() {
  return (
    <section id="events" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-14 md:mb-16">
          <Reveal>
            <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Events
            </span>
          </Reveal>
          <Reveal>
            <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
              Where community{" "}
              <span className="text-gradient">comes alive</span>
            </h2>
          </Reveal>
          <Reveal>
            <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg">
              From family fun days to youth-led community walks, our events
              bring people together to connect, heal, and celebrate.
            </p>
          </Reveal>
        </div>

        {/* Events Preview */}
        <motion.div
          className="grid gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {previewEvents.map((event, i) => (
            <motion.div key={event.title} variants={fadeUp}>
              <Link href={`/events?event=${event.slug}`} className="block">
                <div className="group overflow-hidden rounded-2xl border border-border bg-bg-card transition-all duration-300 hover:border-accent/30 hover:shadow-lg cursor-pointer">
                <div className="grid md:grid-cols-2">
                  {/* Image */}
                  <div className={`relative aspect-[16/10] md:aspect-auto md:min-h-[400px] ${i % 2 === 1 ? "md:order-2" : ""}`}>
                    <Image
                      src={event.image}
                      alt={event.imageAlt}
                      fill
                      quality={95}
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-card/30 via-transparent to-transparent md:bg-none" />
                    {/* Badge */}
                    <div className="absolute top-4 left-4 rounded-full border border-accent/20 bg-bg/80 px-4 py-1.5 text-xs font-semibold text-accent backdrop-blur-sm">
                      {event.badge}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 sm:p-8 md:p-10">
                    {/* Date & Location */}
                    <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {event.location}
                      </span>
                    </div>

                    <h3 className="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold sm:text-2xl">
                      {event.title}
                    </h3>
                    <p className="mb-5 leading-relaxed text-text-secondary">
                      {event.desc}
                    </p>

                    {/* Highlights */}
                    <div className="mb-5">
                      <p className="mb-2 text-sm font-semibold text-text-primary">
                        Highlights
                      </p>
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {event.highlights.slice(0, 4).map((h) => (
                          <li
                            key={h}
                            className="flex items-start gap-2 text-sm text-text-secondary"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Impact */}
                    {event.impact.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-semibold text-text-primary">
                          Impact
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.impact.map((imp) => (
                            <span
                              key={imp}
                              className="rounded-full border border-accent/15 bg-accent-glow px-3 py-1 text-xs font-medium text-accent"
                            >
                              {imp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Events CTA */}
        <Reveal>
          <div className="mt-10 text-center sm:mt-14">
            <Link
              href="/events"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-border-hover px-8 py-3.5 text-sm font-semibold text-text-primary transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent/5"
            >
              <span>View All Events</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="mt-3 text-sm text-text-tertiary">
              See all {events.length} events and photo galleries
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
