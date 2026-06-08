import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Where Are The Men",
  description:
    "Where Are The Men is a Hold It Down CIC campaign calling men, fathers, mentors and role models to show up for young people, families and community.",
  alternates: {
    canonical: "/where-are-the-men",
  },
  openGraph: {
    title: "Where Are The Men | Hold It Down CIC",
    description:
      "A community call to men, fathers, mentors and role models to be present, visible and active in the lives of young people.",
    url: "/where-are-the-men",
    images: [
      {
        url: "/media/roots/community-gathering.jpg",
        width: 1280,
        height: 960,
        alt: "Hold It Down community gathering with families and young people",
      },
    ],
  },
};

const commitments = [
  {
    title: "Show Up",
    text: "Be present in the rooms, conversations and moments where young people need consistent adults around them.",
  },
  {
    title: "Speak Life",
    text: "Use lived experience to guide, encourage and challenge the next generation with honesty and care.",
  },
  {
    title: "Stand Together",
    text: "Build a visible network of men who support families, each other and the wider community.",
  },
];

const focusAreas = [
  "Positive male role models for boys and young men",
  "Fatherhood, family connection and intergenerational support",
  "Safe spaces for honest conversations about identity, pressure and responsibility",
  "Mentoring, encouragement and practical community leadership",
  "Celebrating the men who are already doing the work quietly",
  "Inviting more men to step forward and be part of the change",
];

export default function WhereAreTheMenPage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Navbar />

      <main>
        <section className="relative overflow-hidden pt-28 sm:pt-32">
          <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_at_20%_15%,rgba(217,119,6,0.14),transparent_48%),radial-gradient(ellipse_at_80%_30%,rgba(124,58,237,0.12),transparent_46%)]" />
          <div className="relative mx-auto grid max-w-[1200px] gap-10 px-5 pb-14 sm:px-6 md:grid-cols-[0.95fr_1.05fr] md:items-center md:pb-20">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-accent-warm/25 bg-accent-warm/10 px-4 py-2 text-sm font-semibold text-text-primary">
                A community call to action
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-[clamp(3rem,8vw,6.75rem)] font-bold leading-[0.92] text-text-primary">
                Where Are The Men?
              </h1>
              <p className="mt-6 max-w-[650px] text-lg leading-relaxed text-text-secondary sm:text-xl">
                A Hold It Down CIC campaign calling men, fathers, mentors,
                uncles, brothers and role models to be present, visible and
                active in the lives of young people and families.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Get involved
                </Link>
                <Link
                  href="/vote"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-border bg-bg-card px-6 py-3 text-sm font-semibold text-text-primary transition hover:-translate-y-0.5 hover:border-border-hover"
                >
                  Celebrate a role model
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.25rem] border border-border bg-bg-card shadow-[0_24px_80px_rgba(20,16,32,0.18)]">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/media/roots/community-gathering.jpg"
                  alt="Hold It Down community gathering with families and young people"
                  fill
                  priority
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 580px"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-bg-elevated px-5 py-10 sm:px-6">
          <div className="mx-auto grid max-w-[1200px] gap-4 md:grid-cols-3">
            {commitments.map((item) => (
              <article key={item.title} className="rounded-2xl border border-border bg-bg-card p-6">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold">
                  {item.title}
                </h2>
                <p className="mt-3 leading-relaxed text-text-secondary">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-5 py-14 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div className="overflow-hidden rounded-[1.25rem] border border-border bg-bg-card">
              <div className="relative aspect-[16/11]">
                <Image
                  src="/gallery/roots-and-wings-2024/photo1.jpg"
                  alt="Roots and Wings community event audience and families"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-text-primary">
                Why it matters
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.35rem)] font-bold leading-tight">
                Young people need to see men showing up with consistency.
              </h2>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-text-secondary sm:text-lg">
                <p>
                  Too often, positive men are present in the community but not
                  always visible. Where Are The Men turns that question into an
                  invitation: step forward, connect, mentor, listen and lead by
                  example.
                </p>
                <p>
                  This work is about presence before performance. It is about
                  men standing alongside young people and families in practical,
                  grounded ways that build trust over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#171321] px-5 py-14 text-white sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-[1200px] gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-start">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-white/75">
                The focus
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-tight">
                Presence. Responsibility. Brotherhood. Community.
              </h2>
              <p className="mt-5 max-w-[520px] leading-relaxed text-white/72">
                The campaign creates space for men to be recognised, challenged
                and connected to meaningful action.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {focusAreas.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/12 bg-white/8 p-5 text-sm leading-relaxed text-white/85"
                >
                  <span className="mb-4 block h-2 w-12 rounded-full bg-accent-warm" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-[1100px] gap-6 md:grid-cols-[1fr_0.9fr] md:items-center">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-text-primary">
                Take part
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-tight">
                If you are a man who cares about the next generation, there is
                room for you here.
              </h2>
              <p className="mt-5 max-w-[700px] text-lg leading-relaxed text-text-secondary">
                Join the conversation, volunteer your time, nominate positive
                role models, or help us build spaces where boys and young men
                can feel seen, supported and guided.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-bg-card p-6 md:p-8">
              <h3 className="font-[family-name:var(--font-heading)] text-2xl font-semibold">
                Start with one step
              </h3>
              <div className="mt-6 grid gap-3">
                <Link
                  href="/contact"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Contact Hold It Down
                </Link>
                <Link
                  href="/events"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-border bg-bg-elevated px-6 py-3 text-sm font-semibold text-text-primary transition hover:-translate-y-0.5 hover:border-border-hover"
                >
                  View upcoming events
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
