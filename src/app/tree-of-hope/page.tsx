import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TreeOfHopeScene from "@/components/TreeOfHopeScene";

export const metadata = {
  title: "Tree of Hope | Hold It Down CIC",
  description: "View the Hold It Down CIC Tree of Hope.",
};

export default function TreeOfHopePage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Navbar />
      <main>
        <section className="mx-auto max-w-[1180px] px-5 py-12 pt-32 sm:px-6 lg:py-16 lg:pt-36">
          <h1 className="mb-8 text-center font-[family-name:var(--font-heading)] text-[clamp(2.6rem,6vw,5rem)] font-black leading-[0.95] tracking-tight text-text-primary">
            Tree of Hope
          </h1>
          <TreeOfHopeScene />
        </section>
      </main>
      <Footer />
    </div>
  );
}
