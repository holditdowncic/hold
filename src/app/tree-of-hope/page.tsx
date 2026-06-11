import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TreeOfHopeScene from "@/components/TreeOfHopeScene";

const programmeLinks = [
  {
    title: "Talk Di TingZ Podcast",
    points: [
      "Open episodes with a selected voice note from the tree.",
      "Use community questions from the tree with guests.",
      "Create a dedicated episode on what the community is passing down.",
    ],
  },
  {
    title: "Roots & Wings",
    points: [
      "Use messages from fathers as discussion prompts in the Men’s Discussion Corner.",
      "Capture families contributing at events with their leaf visible on screen.",
      "Read back this year’s messages at the next Roots & Wings gathering.",
    ],
  },
  {
    title: "Echoes of Us",
    points: [
      "Use intergenerational messages as starting points for father-son workshop conversations.",
      "Invite participants to contribute to the tree at the end of each session.",
    ],
  },
  {
    title: "Funding Bids",
    points: [
      "Use contribution numbers as evidence of community engagement.",
      "Quote approved messages to show authentic community voice.",
      "Use voice notes to demonstrate diversity of age, background, and perspective.",
    ],
  },
];

export const metadata = {
  title: "Tree of Hope | Hold It Down CIC",
  description:
    "Add a written message or voice note to a specific part of the Hold It Down Tree of Hope.",
};

export default function TreeOfHopePage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Navbar />
      <main className="pt-28 sm:pt-32">
        <section className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-6 lg:pb-20">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Interactive community archive
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.6rem,6vw,5rem)] font-black leading-[0.95] tracking-tight">
                Tree of Hope
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
                Tap the exact part of the tree, add a written message or voice note, then send it for
                approval before it appears publicly.
              </p>
            </div>
            <Link
              href="/#tree-of-hope"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-bg-card px-5 text-sm font-bold text-text-primary transition hover:border-accent/40 hover:text-accent"
            >
              View on home page
            </Link>
          </div>

          <TreeOfHopeScene />

          <div className="mt-10 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-2xl border border-border bg-bg-card p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Event-day admin</p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
                Review window
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Event-day Tree of Hope submissions are reviewed within 24 hours by the admin team before
                appearing publicly.
              </p>
              <div className="mt-5 rounded-xl border border-accent/20 bg-accent-glow p-4 text-sm font-semibold text-text-primary">
                Admin target: review all 21 June event-day submissions within 24 hours.
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-bg-card p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Connected programmes</p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
                The tree feeds the work
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                The Tree of Hope is a live root system for Hold It Down programmes, not a standalone
                comments wall.
              </p>
            </section>
          </div>

          <section className="mt-4 grid gap-4 md:grid-cols-2">
            {programmeLinks.map((item) => (
              <article key={item.title} className="rounded-2xl border border-border bg-bg-card p-5 sm:p-6">
                <h3 className="text-lg font-bold text-text-primary">{item.title}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-secondary">
                  {item.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
