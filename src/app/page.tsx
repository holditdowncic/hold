import Preloader from "@/components/Preloader";
import CursorGlow from "@/components/CursorGlow";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import About from "@/components/About";
import Mission from "@/components/Mission";
import Programs from "@/components/Programs";
import Events from "@/components/Events";
import Impact from "@/components/Impact";
import CustomSections from "@/components/CustomSections";
import Team from "@/components/Team";
import Support from "@/components/Support";
import CTA from "@/components/CTA";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

import { getAllContent } from "@/lib/content";

export default async function Home() {
  const content = await getAllContent();

  return (
    <>
      <Preloader />
      <CursorGlow />

      <Navbar />
      <main>
        <Hero content={content.hero} />
        <Stats stats={content.stats} />
        <About content={content.about} />
        <Mission content={content.mission} />
        <Programs
          programs={content.programs}
          initiatives={content.initiatives}
          meta={content.programsMeta}
        />
        <Events events={content.events} />
        <Impact />
        <CustomSections sections={content.customSections} />
        <Team members={content.teamMembers} />
        <Support content={content.support} />
        <Gallery images={content.galleryImages} meta={content.galleryMeta} />
        <CTA content={content.cta} />
        <Contact content={content.contact} />
      </main>
      <Footer />
    </>
  );
}
