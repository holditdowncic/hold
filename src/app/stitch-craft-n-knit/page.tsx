import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Stitch Craft N Knit",
  description:
    "Stitch Craft N Knit is a welcoming community teaching group at Thornton Heath Library, built around connection, creativity, and community.",
  alternates: {
    canonical: "/stitch-craft-n-knit",
  },
  openGraph: {
    title: "Stitch Craft N Knit | Hold It Down CIC",
    description:
      "A safe, friendly and creative community space founded and coordinated by Marie Brown.",
    url: "/stitch-craft-n-knit",
    images: [
      {
        url: "/media/stitch-craft-n-knit/holding-picture.jpg",
        width: 960,
        height: 1280,
        alt: "Stitch Craft N Knit community group gathered around a table knitting and crocheting together",
      },
    ],
  },
};

const values = [
  {
    title: "Connection",
    text: "A place to reconnect with others, meet new people, and step gently out of isolation and loneliness.",
  },
  {
    title: "Creativity",
    text: "Hands-on learning that helps people build confidence through exploring and developing new skills, and trying again.",
  },
  {
    title: "Community",
    text: "A safe and supportive teaching group where members can grow and encourage one another.",
  },
];

const expectations = [
  "A friendly and welcoming atmosphere",
  "Hands-on guidance whether you have never held needles or you are casting on your tenth project",
  "Opportunities to meet new people and build lasting friendships",
  "A safe, supportive community space",
  "Creative learning that nurtures confidence and wellbeing",
  "More than knitting: a space to connect, create, and belong",
];

export default function StitchCraftNKnitPage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Navbar />

      <main>
        <section className="relative overflow-hidden pt-28 sm:pt-32">
          <div className="mx-auto grid max-w-[1200px] gap-8 px-5 pb-12 sm:px-6 md:grid-cols-[0.95fr_1.05fr] md:items-center md:pb-16">
            <div className="relative z-10">
              <p className="mb-4 inline-flex rounded-full border border-[#2C7A7B]/25 bg-[#2C7A7B]/10 px-4 py-2 text-sm font-semibold text-text-primary">
                Weekly creative community group
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.6rem,7vw,5.75rem)] font-bold leading-[0.95] text-text-primary">
                Stitch Craft N Knit
              </h1>
              <p className="mt-6 max-w-[620px] text-lg leading-relaxed text-text-secondary sm:text-xl">
                Everything is built around the three C&apos;s: Connection,
                Creativity, and Community.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#weekly-sessions"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#4A224C] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#5D2C60]"
                >
                  View weekly sessions
                </a>
                <Link
                  href="/contact"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-border bg-bg-card px-6 py-3 text-sm font-semibold text-text-primary transition hover:-translate-y-0.5 hover:border-[#2C7A7B]/40"
                >
                  Ask about joining
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.25rem] border border-border bg-bg-card shadow-[0_20px_70px_rgba(30,20,45,0.16)]">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/media/stitch-craft-n-knit/holding-picture.jpg"
                  alt="Stitch Craft N Knit community group gathered around a table knitting and crocheting together"
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
            {values.map((value) => (
              <article
                key={value.title}
                className="rounded-2xl border border-border bg-bg-card p-6"
              >
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
                  {value.title}
                </h2>
                <p className="mt-3 leading-relaxed text-text-secondary">
                  {value.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-5 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-[980px]">
            <div className="max-w-[760px]">
              <p className="mb-3 text-sm font-semibold uppercase text-text-primary">
                Founded by Marie Brown
              </p>
              <div className="mb-8 overflow-hidden rounded-[1.25rem] border border-border bg-bg-card">
                <div className="relative aspect-[16/11]">
                  <Image
                    src="/media/stitch-craft-n-knit/community-knitting-session.jpg"
                    alt="Diverse community craft group knitting and crocheting together around a table"
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 760px"
                  />
                </div>
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.35rem)] font-bold leading-tight">
                A safe place to learn, make, and belong
              </h2>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-text-secondary sm:text-lg">
                <p>
                  Founded by Marie Brown, Stitch Craft N Knit creates a
                  welcoming, safe, and enjoyable space where people can come
                  together, learn new skills, build confidence, and feel
                  empowered through creativity and shared experiences.
                  Alongside her is Marcia Brown, an Intermediate Knitter with
                  endless skills, including reading charts and patterns, as well
                  as creating intricate cable and lace designs.
                </p>
                <p>
                  The group encourages people to step out of isolation and into
                  community life, reconnect with others, meet new people, and
                  rediscover the joy of learning and creating together.
                  Remaining a teaching group is central to the mission, ensuring
                  that members continue to grow, support one another, and develop
                  new skills in a relaxed and friendly environment.
                </p>

              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-bg-elevated px-5 py-14 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-text-primary">
                Latest make
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-tight">
                Finished project
              </h2>
              <p className="mt-6 max-w-[680px] text-base leading-relaxed text-text-secondary sm:text-lg">
                A colourful finished blanket created with different double
                knitting yarns, showing the creativity, patience, and care that
                grows through Stitch Craft N Knit.
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.25rem] border border-border bg-bg-card shadow-[0_18px_50px_rgba(30,20,45,0.12)]">
              <div className="relative aspect-square">
                <Image
                  src="/media/stitch-craft-n-knit/double-knitting-yarn-blanket.jpg"
                  alt="Colourful completed knitted blanket made with different double knitting yarn"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 520px"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="weekly-sessions"
          className="bg-[#102D30] px-5 py-14 text-white sm:px-6 md:py-20"
        >
          <div className="mx-auto grid max-w-[1200px] gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-start">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-white">
                Weekly sessions
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-tight">
                Thornton Heath Library
              </h2>
              <div className="mt-7 grid gap-3 text-lg">
                <div className="rounded-2xl border border-white/12 bg-white/8 p-5">
                  <p className="text-sm font-semibold text-white">Every Tuesday</p>
                  <p className="mt-1 text-2xl font-bold">10:30am to 12:30pm</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {expectations.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/12 bg-white/8 p-5 text-sm leading-relaxed text-white/85"
                >
                  <span className="mb-4 block h-2 w-12 rounded-full bg-white/70" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-[920px] rounded-[1.25rem] border border-border bg-bg-card p-7 text-center sm:p-10 md:p-12">
            <blockquote className="font-[family-name:var(--font-heading)] text-[clamp(1.65rem,3.5vw,2.75rem)] font-semibold leading-tight text-text-primary">
              &ldquo;Knitting is a journey. Sometimes we drop stitches, we
              learn, we adapt, and we keep going. That&apos;s not just crafting,
              that&apos;s life.&rdquo;
            </blockquote>
            <p className="mt-6 text-sm font-semibold text-text-secondary">
              Marie Brown, Founder, Stitch Craft N Knit
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
