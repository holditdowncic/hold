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
  const hidden = new Set((content.site?.hidden_sections || []).map((s) => String(s).trim()).filter(Boolean));

  return (
    <>
      <Preloader />
      <CursorGlow />

      <Navbar />
      <main>
        {!hidden.has("hero") && <Hero content={content.hero} />}
        {!hidden.has("stats") && <Stats stats={content.stats} />}
        {!hidden.has("about") && <About content={content.about} />}
        {!hidden.has("mission") && <Mission content={content.mission} />}
        {!hidden.has("programs") && (
          <Programs
            programs={content.programs}
            initiatives={content.initiatives}
            meta={content.programsMeta}
          />
        )}
        {!hidden.has("events") && <Events events={content.events} meta={content.eventsMeta} />}
        {!hidden.has("impact") && <Impact content={content.impact} />}
        {!hidden.has("custom_sections") && <CustomSections sections={content.customSections} />}
        {!hidden.has("team") && <Team members={content.teamMembers} />}
        {!hidden.has("support") && <Support content={content.support} />}
        {!hidden.has("gallery") && <Gallery images={content.galleryImages} meta={content.galleryMeta} />}
        {!hidden.has("cta") && <CTA content={content.cta} />}
        {!hidden.has("contact") && <Contact content={content.contact} />}
      </main>
      <Footer />
    </>
  );
}
