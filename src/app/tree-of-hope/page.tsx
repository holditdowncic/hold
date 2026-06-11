import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TreeOfHopeScene from "@/components/TreeOfHopeScene";

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
        </section>
      </main>
      <Footer />
    </div>
  );
}
