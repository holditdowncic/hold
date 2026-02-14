"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { events } from "@/lib/events-data";
import { Reveal, fadeUp, staggerContainer } from "@/lib/motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);

  const activeEvent = events.find((e) => e.slug === selectedEvent);

  return (
    <div className="min-h-screen">
      {/* Shared Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-28 pb-12 sm:px-6 sm:pt-32 md:pb-16">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, var(--hero-glow-1) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, var(--hero-glow-2) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[1200px] text-center">
          <Reveal>
            <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Our Events
            </span>
          </Reveal>
          <Reveal>
            <h1 className="mx-auto max-w-[800px] font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight tracking-tight">
              Where community{" "}
              <span className="text-gradient">comes alive</span>
            </h1>
          </Reveal>
          <Reveal>
            <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg">
              From family fun days to youth-led podcast sessions, our events
              bring people together to connect, heal, and celebrate. Here&apos;s
              what we&apos;ve been up to.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Events List */}
      <section className="px-5 pb-16 sm:px-6 md:pb-24">
        <div className="mx-auto max-w-[1200px]">
          <motion.div
            className="grid gap-6 sm:gap-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {events.map((event, i) => (
              <motion.div key={event.slug} variants={fadeUp}>
                <div
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-bg-card transition-all duration-300 hover:border-accent/30 hover:shadow-lg"
                  onClick={() =>
                    setSelectedEvent(
                      selectedEvent === event.slug ? null : event.slug
                    )
                  }
                >
                  <div className="grid md:grid-cols-2">
                    {/* Image */}
                    <div
                      className={`relative aspect-[16/10] md:aspect-auto md:min-h-[350px] ${i % 2 === 1 ? "md:order-2" : ""
                        }`}
                    >
                      <Image
                        src={event.image}
                        alt={event.image_alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-card/60 via-transparent to-transparent md:bg-none" />
                      <div className="absolute top-4 left-4 rounded-full border border-accent/20 bg-bg/80 px-4 py-1.5 text-xs font-semibold text-accent backdrop-blur-sm">
                        {event.badge}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8 md:p-10">
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

                      <h2 className="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold sm:text-2xl">
                        {event.title}
                      </h2>
                      <p className="mb-5 leading-relaxed text-text-secondary">
                        {event.description}
                      </p>

                      {/* Highlights */}
                      <div className="mb-5">
                        <p className="mb-2 text-sm font-semibold text-text-primary">
                          Highlights
                        </p>
                        <ul className="grid gap-1.5 sm:grid-cols-2">
                          {event.highlights.map((h) => (
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
                        <div className="mb-5">
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

                      {/* View Gallery Toggle */}
                      <button className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-warm">
                        {selectedEvent === event.slug
                          ? "Hide gallery"
                          : `View gallery (${event.gallery.length} photos)`}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`transition-transform duration-300 ${selectedEvent === event.slug ? "rotate-180" : ""
                            }`}
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Gallery */}
                  <AnimatePresence>
                    {selectedEvent === event.slug && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-border"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 sm:p-6">
                          {event.gallery.map((img, idx) => (
                            <div
                              key={idx}
                              className="group/img relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-border transition-all hover:border-accent/30"
                              onClick={() => setLightboxImage(idx)}
                            >
                              <Image
                                src={img.src}
                                alt={img.alt}
                                fill
                                className="object-cover transition-transform duration-300 group-hover/img:scale-105"
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Back to Home CTA */}
      <section className="border-t border-border px-5 py-12 text-center sm:px-6">
        <p className="mb-4 text-text-secondary">
          Want to get involved in our next event?
        </p>
        <Link
          href="/contact"
          className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-accent to-accent-warm px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <span>Get In Touch</span>
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
      </section>

      {/* Shared Footer */}
      <Footer />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage !== null && activeEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 backdrop-blur-sm p-4"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={activeEvent.gallery[lightboxImage].src}
                alt={activeEvent.gallery[lightboxImage].alt}
                width={1200}
                height={900}
                className="object-contain"
              />
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-bg/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-accent hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage(
                      lightboxImage === 0
                        ? activeEvent.gallery.length - 1
                        : lightboxImage - 1
                    );
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-bg/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-accent hover:text-white"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="flex items-center px-3 text-sm text-text-secondary">
                  {lightboxImage + 1} / {activeEvent.gallery.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage(
                      lightboxImage === activeEvent.gallery.length - 1
                        ? 0
                        : lightboxImage + 1
                    );
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-bg/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-accent hover:text-white"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
