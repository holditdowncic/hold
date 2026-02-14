import type {
  AboutContent,
  CookieBannerContent,
  ContactContent,
  CTAContent,
  EventData,
  GalleryContent,
  GalleryImage,
  HeroContent,
  Initiative,
  Program,
  ProgramsSectionContent,
  Stat,
  SupportContent,
  TeamMember,
} from "./types";

import sectionsJson from "@/data/sections.json";
import teamJson from "@/data/team.json";
import galleryJson from "@/data/gallery.json";
import programsJson from "@/data/programs.json";
import initiativesJson from "@/data/initiatives.json";
import eventsJson from "@/data/events.json";
import statsJson from "@/data/stats.json";

type SectionsJson = Record<string, unknown>;

function getSection<T>(section: string): T | null {
  const raw = (sectionsJson as SectionsJson)[section];
  if (!raw || typeof raw !== "object") return null;
  return raw as T;
}

function sortByOrder<T extends { sort_order?: number }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
}

// ============================================
// Section content (repo-backed JSON)
// ============================================

export async function getHeroContent(): Promise<HeroContent | null> {
  return getSection<Partial<HeroContent>>("hero") as HeroContent | null;
}

export async function getAboutContent(): Promise<AboutContent | null> {
  return getSection<Partial<AboutContent>>("about") as AboutContent | null;
}

export async function getCTAContent(): Promise<CTAContent | null> {
  return getSection<Partial<CTAContent>>("cta") as CTAContent | null;
}

export async function getContactContent(): Promise<ContactContent | null> {
  return getSection<Partial<ContactContent>>("contact") as ContactContent | null;
}

export async function getSupportContent(): Promise<SupportContent | null> {
  return getSection<Partial<SupportContent>>("support") as SupportContent | null;
}

export async function getGalleryMeta(): Promise<GalleryContent | null> {
  return getSection<Partial<GalleryContent>>("gallery") as GalleryContent | null;
}

export async function getProgramsMeta(): Promise<ProgramsSectionContent | null> {
  return getSection<Partial<ProgramsSectionContent>>("programs") as ProgramsSectionContent | null;
}

export async function getCookieBannerContent(): Promise<CookieBannerContent | null> {
  return getSection<Partial<CookieBannerContent>>("cookie_banner") as CookieBannerContent | null;
}

// ============================================
// Structured content (repo-backed JSON)
// ============================================

export async function getTeamMembers(): Promise<TeamMember[]> {
  return sortByOrder((teamJson as TeamMember[]) ?? []);
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  return sortByOrder((galleryJson as GalleryImage[]) ?? []);
}

export async function getPrograms(): Promise<Program[]> {
  return sortByOrder((programsJson as Program[]) ?? []);
}

export async function getInitiatives(): Promise<Initiative[]> {
  return sortByOrder((initiativesJson as Initiative[]) ?? []);
}

export async function getEvents(): Promise<EventData[]> {
  return sortByOrder((eventsJson as EventData[]) ?? []);
}

export async function getEventBySlug(slug: string): Promise<EventData | null> {
  const events = await getEvents();
  return events.find((e) => e.slug === slug) ?? null;
}

export async function getStats(): Promise<Stat[]> {
  return sortByOrder((statsJson as Stat[]) ?? []);
}

// ============================================
// Fetch all content at once (for page.tsx)
// ============================================

export async function getAllContent() {
  const [
    hero,
    about,
    cta,
    contact,
    support,
    galleryMeta,
    programsMeta,
    teamMembers,
    galleryImages,
    programs,
    initiatives,
    events,
    stats,
  ] = await Promise.all([
    getHeroContent(),
    getAboutContent(),
    getCTAContent(),
    getContactContent(),
    getSupportContent(),
    getGalleryMeta(),
    getProgramsMeta(),
    getTeamMembers(),
    getGalleryImages(),
    getPrograms(),
    getInitiatives(),
    getEvents(),
    getStats(),
  ]);

  return {
    hero,
    about,
    cta,
    contact,
    support,
    galleryMeta,
    programsMeta,
    teamMembers,
    galleryImages,
    programs,
    initiatives,
    events,
    stats,
  };
}
