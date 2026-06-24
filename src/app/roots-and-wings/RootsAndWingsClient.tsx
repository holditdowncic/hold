"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Reveal, fadeUp, staggerContainer } from "@/lib/motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { GalleryImage } from "@/lib/types";

export default function RootsAndWingsClient({ images }: { images: GalleryImage[] }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-5 pt-28 pb-12 sm:px-6 sm:pt-32 md:pb-16">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, var(--hero-glow-1) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, var(--hero-glow-2) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[1200px]">
          <div className="text-center">
            <Reveal>
              <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                Flagship Programme
              </span>
            </Reveal>
            <Reveal>
              <h1 className="mx-auto max-w-[800px] font-[family-name:var(--font-heading)] text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-tight tracking-tight">
                Roots & <span className="text-gradient">Wings</span>
              </h1>
            </Reveal>
            <Reveal>
              <p className="mx-auto mt-6 max-w-[700px] text-lg leading-relaxed text-text-secondary md:text-xl">
                A celebration of fatherhood, family, and intergenerational connection. Empowering the next generation through love, mentorship, and community.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-5 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <Reveal>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border">
                <Image
                  src="/media/roots/roots-23.jpeg"
                  alt="Roots & Wings Family Day"
                  fill
                  className="object-cover"
                />
              </div>
            </Reveal>
            <div className="space-y-6">
              <Reveal>
                <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold">Planting Roots, Giving Wings</h2>
              </Reveal>
              <Reveal>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Roots & Wings brings fathers, children, and families together through sports, workshops, and shared experiences that strengthen bonds and create lasting memories.
                  </p>
                  <p>
                    It’s about planting roots of love and giving wings of confidence to future generations. The programme now forms the foundation for longer-term intergenerational and male mentorship work across Croydon.
                  </p>
                </div>
              </Reveal>
              <Reveal>
                <div className="flex flex-wrap gap-3 pt-4">
                  {["Fatherhood", "Intergenerational", "Family Unity", "Wellbeing", "Mentorship"].map((tag) => (
                    <span key={tag} className="rounded-full border border-border bg-bg-card px-4 py-1.5 text-sm font-medium text-text-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Form */}
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto grid max-w-[1000px] gap-8 rounded-3xl border border-border bg-bg-card p-6 shadow-xl shadow-black/5 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <Reveal>
              <span className="mb-4 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                Feedback form
              </span>
            </Reveal>
            <Reveal>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold md:text-3xl">
                Feedback form for Roots & Wings event
              </h2>
            </Reveal>
            <Reveal>
              <p className="mt-4 max-w-[620px] text-text-secondary">
                Scan the code or open the form to tell us how the day went. Your feedback helps shape future Roots & Wings events for children, young people, families, and the wider community.
              </p>
            </Reveal>
            <Reveal>
              <Link
                href="/roots-and-wings-feedback"
                className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition-all hover:bg-accent-warm hover:shadow-xl"
              >
                Open feedback form
              </Link>
            </Reveal>
          </div>
          <Reveal>
            <Link
              href="/roots-and-wings-feedback"
              className="mx-auto block rounded-3xl border border-border bg-white p-4 transition-transform hover:scale-[1.02]"
              aria-label="Open Roots and Wings feedback form"
            >
              <Image
                src="/media/roots-and-wings/feedback-qr.png"
                alt="Feedback form for Roots & Wings event"
                width={180}
                height={180}
                className="h-40 w-40 sm:h-44 sm:w-44"
              />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* History Section */}
      <section className="bg-bg px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12 text-center">
            <Reveal>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold md:text-4xl">Our Journey</h2>
            </Reveal>
            <Reveal>
              <p className="mt-4 text-text-secondary">Celebrating a legacy of growth and connection</p>
            </Reveal>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { 
                year: "2024", 
                title: "Fatherhood & Family", 
                desc: "17+ activities and workshops focused on bonding.",
                link: "/events#roots-and-wings-2024-fatherhood-family"
              },
              { 
                year: "2025", 
                title: "Roots & Wings Fun Day", 
                desc: "300+ attendees joined for our biggest celebration yet.",
                link: "/events#roots-and-wings-2025"
              },
              { 
                year: "2026", 
                title: "The Vision Expands", 
                desc: "Scaling our impact across more South London boroughs.",
                link: "/events#roots-and-wings-fun-day-2026"
              }
            ].map((item) => (
              <Reveal key={item.year}>
                <Link 
                  href={item.link}
                  className="group block rounded-2xl border border-border bg-bg-card p-8 transition-all hover:border-accent/40 hover:shadow-2xl"
                >
                  <span className="mb-4 inline-block text-4xl font-bold text-accent/20 group-hover:text-accent/40 transition-colors">
                    {item.year}
                  </span>
                  <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                  <p className="text-text-secondary">{item.desc}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="bg-bg-alt px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12 text-center">
            <Reveal>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold md:text-4xl">Roots & Wings 2024 Gallery</h2>
            </Reveal>
            <Reveal>
              <p className="mt-4 text-text-secondary">Moments from our 2024 community gathering</p>
            </Reveal>
          </div>

          <motion.div 
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {images.map((image, idx) => (
              <motion.div
                key={image.id}
                variants={fadeUp}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-border bg-bg-card"
                onClick={() => setSelectedImage(idx)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                <p className="absolute inset-x-0 bottom-0 px-3 pb-3 text-xs font-semibold leading-snug text-white sm:text-sm">
                  {image.caption}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Upcoming Event CTA */}
      <section className="px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-[1000px] overflow-hidden rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-blue-900 to-blue-950 p-8 text-center md:p-16">
          <Reveal>
            <span className="mb-6 inline-block rounded-full bg-yellow-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-950">
              Coming Soon
            </span>
          </Reveal>
          <Reveal>
            <h2 className="mb-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-white md:text-5xl">
              Roots & Wings Fun Day 2026
            </h2>
          </Reveal>
          <Reveal>
            <p className="mx-auto mb-10 max-w-[600px] text-blue-100 md:text-lg">
              Save the date! Join us on Saturday 20th June for our next major community celebration.
            </p>
          </Reveal>
          <Reveal>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/events"
                className="rounded-full bg-yellow-400 px-8 py-4 text-sm font-bold text-blue-950 transition-all hover:bg-yellow-300 hover:shadow-xl"
              >
                View Event Details
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-white/20 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10"
              >
                Get In Touch
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 backdrop-blur-sm p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-[80vh] w-[90vw] max-w-[1000px]">
                <Image
                  src={images[selectedImage].src}
                  alt={images[selectedImage].alt}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
              </div>
              <p className="absolute inset-x-0 bottom-0 bg-bg/80 px-5 py-3 text-center text-sm font-semibold text-text-primary backdrop-blur-sm">
                {images[selectedImage].caption}
              </p>
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  className="rounded-full bg-bg/50 p-2 text-text-primary backdrop-blur-md hover:bg-bg/80"
                  onClick={() => setSelectedImage(null)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
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
