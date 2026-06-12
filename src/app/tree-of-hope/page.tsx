import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TreeOfHopeScene from "@/components/TreeOfHopeScene";
import Image from "next/image";

export const metadata = {
  title: "Tree of Hope | Hold It Down CIC",
  description:
    "Add a written message or voice note to a specific part of the Hold It Down Tree of Hope.",
};

export default function TreeOfHopePage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Navbar />
      <main>
        <section className="relative isolate min-h-[520px] overflow-hidden pt-28 text-white sm:min-h-[620px] sm:pt-32">
          <Image
            src="/media/tree-of-hope-hero-family.jpg"
            alt="Father with two daughters on a blue playground for the Tree of Hope"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,8,5,0.72),rgba(10,8,5,0.38)_52%,rgba(10,8,5,0.1))]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg to-transparent" />
          <div className="relative mx-auto flex min-h-[430px] max-w-[1180px] items-end px-5 pb-16 sm:min-h-[520px] sm:px-6 lg:pb-20">
            <div className="max-w-4xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                Tree of Hope
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.6rem,6vw,5rem)] font-black leading-[0.95] tracking-tight">
                What was given to you that you want to pass on?
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/86 sm:text-lg">
                Leave a message, memory, blessing, or voice note for the next person who needs it.
                Every approved leaf becomes part of a living community tree.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6 lg:py-16">
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
