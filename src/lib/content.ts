import { supabaseAdmin } from "./supabase";
import type {
    HeroContent,
    AboutContent,
    CTAContent,
    ContactContent,
    SupportContent,
    GalleryContent,
    ProgramsSectionContent,
    CookieBannerContent,
    TeamMember,
    GalleryImage,
    Program,
    Initiative,
    EventData,
    Stat,
} from "./types";

// ============================================
// Section content fetchers (JSONB)
// ============================================

async function getSectionContent<T>(section: string): Promise<T | null> {
    if (!supabaseAdmin) return null;

    const { data, error } = await supabaseAdmin
        .from("site_content")
        .select("content")
        .eq("section", section)
        .single();

    if (error || !data) return null;
    return data.content as T;
}

export async function getHeroContent(): Promise<HeroContent | null> {
    return getSectionContent<HeroContent>("hero");
}

export async function getAboutContent(): Promise<AboutContent | null> {
    return getSectionContent<AboutContent>("about");
}

export async function getCTAContent(): Promise<CTAContent | null> {
    return getSectionContent<CTAContent>("cta");
}

export async function getContactContent(): Promise<ContactContent | null> {
    return getSectionContent<ContactContent>("contact");
}

export async function getSupportContent(): Promise<SupportContent | null> {
    return getSectionContent<SupportContent>("support");
}

export async function getGalleryMeta(): Promise<GalleryContent | null> {
    return getSectionContent<GalleryContent>("gallery");
}

export async function getProgramsMeta(): Promise<ProgramsSectionContent | null> {
    return getSectionContent<ProgramsSectionContent>("programs");
}

export async function getCookieBannerContent(): Promise<CookieBannerContent | null> {
    return getSectionContent<CookieBannerContent>("cookie_banner");
}

// ============================================
// Structured table fetchers
// ============================================

export async function getTeamMembers(): Promise<TeamMember[]> {
    if (!supabaseAdmin) return [];

    const { data, error } = await supabaseAdmin
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data as TeamMember[];
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
    if (!supabaseAdmin) return [];

    const { data, error } = await supabaseAdmin
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data as GalleryImage[];
}

export async function getPrograms(): Promise<Program[]> {
    if (!supabaseAdmin) return [];

    const { data, error } = await supabaseAdmin
        .from("programs")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data as Program[];
}

export async function getInitiatives(): Promise<Initiative[]> {
    if (!supabaseAdmin) return [];

    const { data, error } = await supabaseAdmin
        .from("initiatives")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data as Initiative[];
}

export async function getEvents(): Promise<EventData[]> {
    if (!supabaseAdmin) return [];

    const { data, error } = await supabaseAdmin
        .from("events")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data as EventData[];
}

export async function getEventBySlug(slug: string): Promise<EventData | null> {
    if (!supabaseAdmin) return null;

    const { data, error } = await supabaseAdmin
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error || !data) return null;
    return data as EventData;
}

export async function getStats(): Promise<Stat[]> {
    if (!supabaseAdmin) return [];

    const { data, error } = await supabaseAdmin
        .from("stats")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data as Stat[];
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
