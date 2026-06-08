import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Where Are The Men",
  description:
    "Where Are The Men is an ongoing Hold It Down CIC community campaign creating spaces for men and boys to connect, reflect and grow together.",
  alternates: {
    canonical: "/where-are-the-men",
  },
  openGraph: {
    title: "Where Are The Men | Hold It Down CIC",
    description:
      "An ongoing community campaign creating opportunities for men and boys to connect, learn, reflect and grow together.",
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
    title: "Presence",
    text: "Not just physically, but emotionally, relationally, and in the moments where presence matters most.",
  },
  {
    title: "Responsibility",
    text: "Exploring how men choose to show up for themselves, their families, and their communities.",
  },
  {
    title: "Connection",
    text: "Creating opportunities for men and boys to be seen, heard, supported, challenged and encouraged.",
  },
];

const welcomeList = [
  "Men and boys",
  "Fathers and sons",
  "Mentors and mentees",
  "Advocates and community members",
  "Anyone committed to building stronger families and communities",
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
                An ongoing community campaign by Hold It Down CIC
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-[clamp(3rem,8vw,6.75rem)] font-bold leading-[0.92] text-text-primary">
                Where Are The Men?
              </h1>
              <p className="mt-6 max-w-[650px] text-lg leading-relaxed text-text-secondary sm:text-xl">
                Launched in Brixton on 10 April, Where Are The Men? began with
                a simple question about presence, responsibility, connection,
                and how we choose to show up for ourselves, our families, and
                our communities.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Join the conversation
                </Link>
                <a
                  href="#why-it-matters"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-border bg-bg-card px-6 py-3 text-sm font-semibold text-text-primary transition hover:-translate-y-0.5 hover:border-border-hover"
                >
                  Why it matters
                </a>
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
                How it began
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.35rem)] font-bold leading-tight">
                Where are the men?
              </h2>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-text-secondary sm:text-lg">
                <p>
                  Not just physically. But emotionally, relationally, and in the
                  moments where presence matters most.
                </p>
                <p>
                  As the conversation grew, it became clear that this question
                  is about more than attendance. It is about engagement,
                  responsibility, connection, and how we choose to show up for
                  ourselves, our families, and our communities.
                </p>
                <p>
                  Through public reflection experiences, community
                  conversations, and weekly gatherings, the campaign creates
                  opportunities for men and boys to connect, learn, reflect, and
                  grow together.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="why-it-matters" className="bg-[#171321] px-5 py-14 text-white sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-[1200px] gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-start">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-white/75">
                Why it matters
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-tight">
                Every child is shaped by example.
              </h2>
              <p className="mt-5 max-w-[560px] leading-relaxed text-white/72">
                Every relationship is shaped by presence. Every community is
                shaped by participation.
              </p>
            </div>

            <div className="space-y-5 rounded-2xl border border-white/12 bg-white/8 p-6 text-base leading-relaxed text-white/82 sm:text-lg md:p-8">
              <p>
                When men actively engage as fathers, sons, mentors, partners,
                advocates, and community members, their presence can have a
                lasting impact on the lives of others.
              </p>
              <p>
                This campaign is not about blame. It is about creating spaces
                where men and boys can be seen, heard, supported, challenged,
                and encouraged to play an active role in the lives of those
                around them.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-[1100px] gap-8 md:grid-cols-[1fr_0.9fr] md:items-start">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-text-primary">
                Join the conversation
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-tight">
                We welcome anyone committed to building stronger families and
                communities.
              </h2>
              <div className="mt-5 space-y-5 text-lg leading-relaxed text-text-secondary">
                <p>
                  Following successful public engagement events in Brixton and
                  Croydon, the campaign continues through regular community
                  gatherings and public reflection experiences.
                </p>
                <p>
                  Together, we explore what it means to show up with purpose,
                  responsibility, and presence.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-bg-card p-6 md:p-8">
              <h3 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
                This space is for
              </h3>
              <ul className="mt-6 space-y-3">
                {welcomeList.map((item) => (
                  <li key={item} className="flex gap-3 text-text-secondary">
                    <span className="mt-2 h-2 w-2 flex-none rounded-full bg-accent-warm" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-bg-elevated px-5 py-14 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-[1100px] gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-start">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-text-primary">
                Share your voice
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-tight">
                Tell us what this question means to you.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-text-secondary">
                Where Are The Men? was never intended to provide all the
                answers. It was created to start a conversation.
              </p>
            </div>

            <div className="space-y-5 rounded-2xl border border-border bg-bg-card p-6 text-base leading-relaxed text-text-secondary sm:text-lg md:p-8">
              <p>
                We recognise that everyone experiences this question
                differently. For some, it may bring thoughts of fatherhood. For
                others, mentorship, relationships, community, responsibility,
                leadership, or personal reflection.
              </p>
              <p>
                We invite you to share your thoughts, experiences, and
                reflections. You may wish to answer one simple question:
                <span className="mt-3 block font-semibold text-text-primary">
                  Where are the men?
                </span>
              </p>
              <p>
                Or perhaps an even deeper one:
                <span className="mt-3 block font-semibold text-text-primary">
                  What becomes possible when men and boys show up?
                </span>
              </p>
              <p className="font-semibold text-text-primary">
                Your voice matters. Your experiences matter. Together, those
                voices help shape the future of this campaign.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-6 md:pb-24">
          <div className="mx-auto max-w-[980px] rounded-[1.25rem] border border-border bg-bg-card p-7 text-center sm:p-10 md:p-12">
            <p className="mb-3 text-sm font-semibold uppercase text-text-primary">
              Looking forward
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-tight text-text-primary">
              Creating spaces where men and boys can discover where they belong.
            </h2>
            <div className="mx-auto mt-6 max-w-[760px] space-y-5 text-base leading-relaxed text-text-secondary sm:text-lg">
              <p>
                The goal is not simply to ask where the men are. The goal is to
                create spaces where men and boys can discover where they
                belong, how they can contribute, and what becomes possible when
                they choose to show up consistently for themselves and others.
              </p>
              <p className="font-semibold text-text-primary">
                The question remains: Where are the men?
              </p>
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
        </section>
      </main>

      <Footer />
    </div>
  );
}
