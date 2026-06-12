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
          <div className="mb-6 sm:mb-8">
            <div className="max-w-4xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Tree of Hope
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.6rem,6vw,5rem)] font-black leading-[0.95] tracking-tight">
                What was given to you that you want to pass on?
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
                Leave a message, memory, blessing, or voice note for the next person who needs it.
                Every approved leaf becomes part of a living community tree.
              </p>
            </div>
          </div>

          <TreeOfHopeScene />

          <section className="mt-8 max-w-3xl">
            <p className="text-lg font-semibold leading-relaxed text-text-primary">
              This tree grows through what people choose to pass down: courage, love, lessons,
              forgiveness, names, memories, and hope.
            </p>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
